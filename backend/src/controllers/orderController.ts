import { Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import LedgerTransaction from '../models/LedgerTransaction';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { getLastLedgerBalance } from '../utils/balanceHelper';

interface OrderItemInput {
  productId: string;
  quantity: number;
  rate?: number; // admin can override rate
}

// GET /api/orders  (admin — all shops)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, filter, dateFrom, dateTo, page = '1', limit = '50' } = req.query as Record<string, string>;

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
      // Custom date range
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

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

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

    // Search by order number or shop name
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'shop.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    pipeline.push({
      $project: {
        orderNumber: 1,
        shopId: 1,
        'shop.name': 1,
        'shop.ownerName': 1,
        items: 1,
        total: 1,
        status: 1,
        createdAt: 1,
        itemCount: { $size: '$items' },
      },
    });

    const orders = await Order.aggregate(pipeline);

    // Total count for pagination
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
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'shop.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    countPipeline.push({ $count: 'total' });
    const countResult = await Order.aggregate(countPipeline);
    const total = countResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'name ownerName phone')
      .populate('createdBy', 'name')
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Customer can only view their own shop's orders
    if (req.user!.role === 'customer') {
      const shopIdValue = order.shopId as unknown;
      const orderShopId =
        shopIdValue !== null &&
          typeof shopIdValue === 'object' &&
          '_id' in (shopIdValue as Record<string, unknown>)
          ? String((shopIdValue as Record<string, unknown>)._id)
          : String(shopIdValue);

      if (req.user!.shopId?.toString() !== orderShopId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/shops/:shopId/orders
export const getOrdersByShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;

    if (req.user!.role === 'customer' && req.user!.shopId?.toString() !== shopId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const orders = await Order.find({ shopId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('getOrdersByShop error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders  (admin only)
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId, items }: { shopId: string; items: OrderItemInput[] } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'shopId and items are required' });
      return;
    }

    // Resolve products and build order items
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.productId || item.quantity <= 0) {
          throw new Error(`Invalid item: productId and quantity > 0 required`);
        }
        const product = await Product.findById(item.productId).lean();
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.status === 'inactive') throw new Error(`Product ${product.name} is inactive`);
        const rate = item.rate !== undefined && item.rate > 0 ? item.rate : product.defaultRate;
        const total = Math.round(rate * item.quantity * 100) / 100;
        return {
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          unit: product.unit,
          rate,
          total,
        };
      })
    );

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0);
    const total = subtotal;
    const orderNumber = await generateOrderNumber();
    const prevBalance = await getLastLedgerBalance(shopId);
    const newBalance = prevBalance + total;

    // Create order
    const order = await Order.create({
      orderNumber,
      shopId,
      items: resolvedItems,
      subtotal,
      total,
      status: 'confirmed',
      createdBy: req.user!._id,
    });

    // Create ledger debit entry
    await LedgerTransaction.create({
      shopId,
      type: 'ORDER',
      referenceId: order._id,
      description: `Order ${orderNumber}`,
      debit: total,
      credit: 0,
      balanceAfter: newBalance,
      createdBy: req.user!._id,
    });

    const populated = await Order.findById(order._id)
      .populate('shopId', 'name ownerName')
      .populate('createdBy', 'name')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error while creating order';
    console.error('createOrder error:', error);
    res.status(400).json({ success: false, message: msg });
  }
};
