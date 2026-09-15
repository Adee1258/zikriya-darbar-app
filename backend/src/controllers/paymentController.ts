import { Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import LedgerTransaction from '../models/LedgerTransaction';
import Shop from '../models/Shop';
import { AuthRequest } from '../middleware/auth';
import { getLastLedgerBalance } from '../utils/balanceHelper';

// GET /api/payments  (admin — all shops)
export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, filter, dateFrom, dateTo, page = '1', limit = '100' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const matchStage: Record<string, unknown> = {};

    // Date filter — named quick filters OR custom range
    const now = new Date();
    if (filter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchStage.createdAt = { $gte: start };
    } else if (filter === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      matchStage.createdAt = { $gte: start };
    } else if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      matchStage.createdAt = { $gte: start };
    } else if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (!isNaN(from.getTime())) range.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (!isNaN(to.getTime())) range.$lte = to;
      }
      if (Object.keys(range).length > 0) matchStage.createdAt = range;
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'shops',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shop',
        },
      },
      { $unwind: '$shop' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'shop.name': { $regex: search, $options: 'i' } },
            { paymentMethod: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    pipeline.push({
      $project: {
        shopId: {
          _id: '$shop._id',
          name: '$shop.name',
          ownerName: '$shop.ownerName',
        },
        amount: 1,
        paymentMethod: 1,
        notes: 1,
        createdAt: 1,
        createdBy: 1,
      },
    });

    const payments = await Payment.aggregate(pipeline);

    const countPipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'shops',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shop',
        },
      },
      { $unwind: '$shop' },
    ];
    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { 'shop.name': { $regex: search, $options: 'i' } },
            { paymentMethod: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    countPipeline.push({ $count: 'total' });
    const countResult = await Payment.aggregate(countPipeline);
    const total = countResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: payments,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('getAllPayments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/payments/:id
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('shopId', 'name ownerName')
      .populate('createdBy', 'name')
      .lean();

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    if (req.user!.role === 'customer') {
      if (req.user!.shopId?.toString() !== payment.shopId.toString()) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/shops/:shopId/payments
export const getPaymentsByShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;

    if (req.user!.role === 'customer' && req.user!.shopId?.toString() !== shopId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const payments = await Payment.find({ shopId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('getPaymentsByShop error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/payments  (admin only)
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId, amount, paymentMethod, notes } = req.body;

    if (!shopId || !amount || !paymentMethod) {
      res.status(400).json({ success: false, message: 'shopId, amount, and paymentMethod are required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const shop = await Shop.findById(shopId).lean();
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    const prevBalance = await getLastLedgerBalance(shopId);
    const newBalance = prevBalance - parsedAmount;

    // Create payment
    const payment = await Payment.create({
      shopId,
      amount: parsedAmount,
      paymentMethod,
      notes: notes || '',
      createdBy: req.user!._id,
    });

    // Create ledger credit entry
    await LedgerTransaction.create({
      shopId,
      type: 'PAYMENT',
      referenceId: payment._id,
      description: `Payment Received (${paymentMethod})`,
      debit: 0,
      credit: parsedAmount,
      balanceAfter: newBalance,
      createdBy: req.user!._id,
    });

    const populated = await Payment.findById(payment._id)
      .populate('shopId', 'name ownerName')
      .populate('createdBy', 'name')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
      meta: {
        previousBalance: prevBalance,
        paymentAmount: parsedAmount,
        newBalance,
      },
    });
  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({ success: false, message: 'Server error while recording payment' });
  }
};
