import { Response } from 'express';
import mongoose from 'mongoose';
import Market from '../models/Market';
import Shop from '../models/Shop';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { calculateShopBalance } from '../utils/balanceHelper';

// ─── GET /api/markets ────────────────────────────────────────────────────────
export const getAllMarkets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const markets = await Market.find().sort({ visitDay: 1, name: 1 }).lean();

    // Attach shop count to each market
    const marketsWithCount = await Promise.all(
      markets.map(async (market) => {
        const shopCount = await Shop.countDocuments({ marketId: market._id, isActive: true });
        return { ...market, shopCount };
      })
    );

    res.status(200).json({ success: true, data: marketsWithCount });
  } catch (error) {
    console.error('getAllMarkets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/markets/:id ────────────────────────────────────────────────────
export const getMarketById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const market = await Market.findById(req.params.id).lean();
    if (!market) {
      res.status(404).json({ success: false, message: 'Market not found' });
      return;
    }

    const shops = await Shop.find({ marketId: market._id, isActive: true })
      .sort({ name: 1 })
      .lean();

    // Attach current balance to each shop
    const shopsWithBalance = await Promise.all(
      shops.map(async (shop) => {
        const balance = await calculateShopBalance(shop._id as mongoose.Types.ObjectId);
        return { ...shop, currentBalance: balance };
      })
    );

    res.status(200).json({
      success: true,
      data: { ...market, shops: shopsWithBalance },
    });
  } catch (error) {
    console.error('getMarketById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/markets ───────────────────────────────────────────────────────
export const createMarket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, visitDay, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Market name is required' });
      return;
    }

    const existing = await Market.findOne({ name: name.trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'A market with this name already exists' });
      return;
    }

    const market = await Market.create({
      name: name.trim(),
      visitDay: visitDay || 'None',
      description: description?.trim() || '',
    });

    res.status(201).json({ success: true, data: market });
  } catch (error) {
    console.error('createMarket error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating market' });
  }
};

// ─── PUT /api/markets/:id ────────────────────────────────────────────────────
export const updateMarket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, visitDay, description, isActive } = req.body;

    // If renaming, check uniqueness against other markets
    if (name) {
      const existing = await Market.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        res.status(409).json({ success: false, message: 'A market with this name already exists' });
        return;
      }
    }

    const market = await Market.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(visitDay !== undefined && { visitDay }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!market) {
      res.status(404).json({ success: false, message: 'Market not found' });
      return;
    }

    res.status(200).json({ success: true, data: market });
  } catch (error) {
    console.error('updateMarket error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating market' });
  }
};

// ─── DELETE /api/markets/:id ─────────────────────────────────────────────────
export const deleteMarket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopCount = await Shop.countDocuments({ marketId: req.params.id });
    if (shopCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete market — ${shopCount} shop(s) are assigned to it. Reassign them first.`,
      });
      return;
    }

    const market = await Market.findByIdAndDelete(req.params.id);
    if (!market) {
      res.status(404).json({ success: false, message: 'Market not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Market deleted successfully' });
  } catch (error) {
    console.error('deleteMarket error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting market' });
  }
};

// ─── GET /api/markets/:id/report ─────────────────────────────────────────────
// Weekly report for a specific market: per-shop + totals
export const getMarketReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Accept ?days=7 (default 7), ?days=30 etc.
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string || '7', 10)));

    const market = await Market.findById(id).lean();
    if (!market) {
      res.status(404).json({ success: false, message: 'Market not found' });
      return;
    }

    const shops = await Shop.find({ marketId: id, isActive: true }).sort({ name: 1 }).lean();

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const shopReports = await Promise.all(
      shops.map(async (shop) => {
        const shopObjId = shop._id as mongoose.Types.ObjectId;

        const [orderAgg, paymentAgg, currentBalance] = await Promise.all([
          Order.aggregate([
            {
              $match: {
                shopId: shopObjId,
                status: 'confirmed',
                createdAt: { $gte: since },
              },
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: '$total' },
              },
            },
          ]),
          Payment.aggregate([
            {
              $match: {
                shopId: shopObjId,
                createdAt: { $gte: since },
              },
            },
            {
              $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalReceived: { $sum: '$amount' },
              },
            },
          ]),
          calculateShopBalance(shopObjId),
        ]);

        return {
          shopId: shop._id,
          shopName: shop.name,
          ownerName: shop.ownerName,
          phone: shop.phone,
          periodOrders: orderAgg[0]?.totalOrders ?? 0,
          periodSales: orderAgg[0]?.totalAmount ?? 0,
          periodPayments: paymentAgg[0]?.totalPayments ?? 0,
          periodReceived: paymentAgg[0]?.totalReceived ?? 0,
          currentBalance,
        };
      })
    );

    // Market-level totals
    const totals = shopReports.reduce(
      (acc, s) => ({
        totalOrders: acc.totalOrders + s.periodOrders,
        totalSales: acc.totalSales + s.periodSales,
        totalPayments: acc.totalPayments + s.periodPayments,
        totalReceived: acc.totalReceived + s.periodReceived,
        totalOutstanding: acc.totalOutstanding + s.currentBalance,
      }),
      { totalOrders: 0, totalSales: 0, totalPayments: 0, totalReceived: 0, totalOutstanding: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        market,
        days,
        since: since.toISOString(),
        shops: shopReports,
        totals,
      },
    });
  } catch (error) {
    console.error('getMarketReport error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/markets/report/all ─────────────────────────────────────────────
// Summary across ALL markets for a given period
export const getAllMarketsReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string || '7', 10)));

    const markets = await Market.find({ isActive: true }).sort({ visitDay: 1, name: 1 }).lean();

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const marketSummaries = await Promise.all(
      markets.map(async (market) => {
        const shops = await Shop.find({ marketId: market._id, isActive: true }).lean();
        const shopIds = shops.map((s) => s._id as mongoose.Types.ObjectId);

        if (shopIds.length === 0) {
          return {
            marketId: market._id,
            marketName: market.name,
            visitDay: market.visitDay,
            shopCount: 0,
            periodOrders: 0,
            periodSales: 0,
            periodReceived: 0,
            totalOutstanding: 0,
          };
        }

        const [orderAgg, paymentAgg, balances] = await Promise.all([
          Order.aggregate([
            { $match: { shopId: { $in: shopIds }, status: 'confirmed', createdAt: { $gte: since } } },
            { $group: { _id: null, totalOrders: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
          ]),
          Payment.aggregate([
            { $match: { shopId: { $in: shopIds }, createdAt: { $gte: since } } },
            { $group: { _id: null, totalReceived: { $sum: '$amount' } } },
          ]),
          Promise.all(shopIds.map((sid) => calculateShopBalance(sid))),
        ]);

        const totalOutstanding = balances.reduce((sum, b) => sum + b, 0);

        return {
          marketId: market._id,
          marketName: market.name,
          visitDay: market.visitDay,
          shopCount: shops.length,
          periodOrders: orderAgg[0]?.totalOrders ?? 0,
          periodSales: orderAgg[0]?.totalAmount ?? 0,
          periodReceived: paymentAgg[0]?.totalReceived ?? 0,
          totalOutstanding,
        };
      })
    );

    // Unassigned shops (marketId = null)
    const unassignedShops = await Shop.find({ marketId: null, isActive: true }).lean();
    const unassignedIds = unassignedShops.map((s) => s._id as mongoose.Types.ObjectId);

    let unassignedSummary = {
      marketId: null as null,
      marketName: 'Unassigned',
      visitDay: 'None' as const,
      shopCount: unassignedShops.length,
      periodOrders: 0,
      periodSales: 0,
      periodReceived: 0,
      totalOutstanding: 0,
    };

    if (unassignedIds.length > 0) {
      const [uOrders, uPayments, uBalances] = await Promise.all([
        Order.aggregate([
          { $match: { shopId: { $in: unassignedIds }, status: 'confirmed', createdAt: { $gte: since } } },
          { $group: { _id: null, totalOrders: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
        ]),
        Payment.aggregate([
          { $match: { shopId: { $in: unassignedIds }, createdAt: { $gte: since } } },
          { $group: { _id: null, totalReceived: { $sum: '$amount' } } },
        ]),
        Promise.all(unassignedIds.map((sid) => calculateShopBalance(sid))),
      ]);
      unassignedSummary = {
        ...unassignedSummary,
        periodOrders: uOrders[0]?.totalOrders ?? 0,
        periodSales: uOrders[0]?.totalAmount ?? 0,
        periodReceived: uPayments[0]?.totalReceived ?? 0,
        totalOutstanding: uBalances.reduce((s, b) => s + b, 0),
      };
    }

    const allEntries = unassignedShops.length > 0
      ? [...marketSummaries, unassignedSummary]
      : marketSummaries;

    const grandTotals = allEntries.reduce(
      (acc, m) => ({
        totalShops: acc.totalShops + m.shopCount,
        totalOrders: acc.totalOrders + m.periodOrders,
        totalSales: acc.totalSales + m.periodSales,
        totalReceived: acc.totalReceived + m.periodReceived,
        totalOutstanding: acc.totalOutstanding + m.totalOutstanding,
      }),
      { totalShops: 0, totalOrders: 0, totalSales: 0, totalReceived: 0, totalOutstanding: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        days,
        since: since.toISOString(),
        markets: allEntries,
        grandTotals,
      },
    });
  } catch (error) {
    console.error('getAllMarketsReport error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
