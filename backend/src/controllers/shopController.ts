import { Response } from 'express';
import mongoose from 'mongoose';
import Shop from '../models/Shop';
import User from '../models/User';
import LedgerTransaction from '../models/LedgerTransaction';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { calculateShopBalance } from '../utils/balanceHelper';

// GET /api/shops  (admin only)
export const getAllShops = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const marketId = req.query.marketId as string | undefined;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by market: pass marketId=null to get unassigned, or a valid ObjectId
    if (marketId !== undefined) {
      if (marketId === 'null' || marketId === '') {
        filter.marketId = null;
      } else {
        filter.marketId = new mongoose.Types.ObjectId(marketId);
      }
    }

    const shops = await Shop.find(filter)
      .populate('marketId', 'name visitDay')
      .sort({ createdAt: -1 })
      .lean();

    // Attach calculated balance to each shop
    const shopsWithBalance = await Promise.all(
      shops.map(async (shop) => {
        const balance = await calculateShopBalance(shop._id as mongoose.Types.ObjectId);
        return { ...shop, currentBalance: balance };
      })
    );

    res.status(200).json({ success: true, data: shopsWithBalance });
  } catch (error) {
    console.error('getAllShops error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/shops/:id
export const getShopById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopId = req.params.id;

    // Customers can only access their own shop
    if (req.user!.role === 'customer') {
      if (req.user!.shopId?.toString() !== shopId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    const shop = await Shop.findById(shopId)
      .populate('marketId', 'name visitDay')
      .lean();
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    const balance = await calculateShopBalance(shopId);

    // Get linked user's username
    const linkedUser = await User.findOne({ shopId: shop._id }, { username: 1 }).lean();

    // Summary stats
    const orderAgg = await Order.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId), status: 'confirmed' } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalPurchased: { $sum: '$total' } } },
    ]);
    const paymentAgg = await Payment.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]);

    const summary = {
      totalOrders: orderAgg[0]?.totalOrders ?? 0,
      totalPurchased: orderAgg[0]?.totalPurchased ?? 0,
      totalPaid: paymentAgg[0]?.totalPaid ?? 0,
      currentBalance: balance,
    };

    res.status(200).json({ success: true, data: { ...shop, currentBalance: balance, username: linkedUser?.username || '', summary } });
  } catch (error) {
    console.error('getShopById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/shops  (admin only)
export const createShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerName, phone, address, username, password, openingBalance, marketId } = req.body;

    if (!name || !ownerName || !phone || !address || !username || !password) {
      res.status(400).json({ success: false, message: 'All required fields must be provided' });
      return;
    }

    // Check username uniqueness (no session needed)
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Username already taken. Please choose a different username.' });
      return;
    }

    // Create login user for the shop
    const user = await User.create({
      name: ownerName,
      username: username.toLowerCase().trim(),
      password,
      role: 'customer',
      shopId: null,
    });

    // Create shop
    const opening = Number(openingBalance) || 0;
    let shop;
    try {
      shop = await Shop.create({
        name,
        ownerName,
        phone,
        address,
        userId: user._id,
        marketId: marketId || null,
        openingBalance: opening,
      });
    } catch (shopErr) {
      // If shop creation fails, clean up the user
      await User.findByIdAndDelete(user._id);
      throw shopErr;
    }

    // Link user → shop
    await User.findByIdAndUpdate(user._id, { shopId: shop._id });

    // Create opening balance ledger entry if openingBalance > 0
    if (opening > 0) {
      await LedgerTransaction.create({
        shopId: shop._id,
        type: 'OPENING_BALANCE',
        referenceId: null,
        description: 'Opening Balance',
        debit: opening,
        credit: 0,
        balanceAfter: opening,
        createdBy: req.user!._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: { shop, username: user.username },
    });
  } catch (error) {
    console.error('createShop error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating shop' });
  }
};

// PUT /api/shops/:id  (admin only)
export const updateShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerName, phone, address, marketId } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(ownerName !== undefined && { ownerName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        // marketId can be set to null (unassign) or a valid id
        ...(marketId !== undefined && { marketId: marketId || null }),
      },
      { new: true, runValidators: true }
    )
      .populate('marketId', 'name visitDay')
      .lean();

    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    console.error('updateShop error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/balances  (admin only) — all shops with current balances
export const getAllBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shops = await Shop.find({ isActive: true })
      .populate('marketId', 'name visitDay')
      .sort({ name: 1 })
      .lean();

    const results = await Promise.all(
      shops.map(async (shop) => {
        const balance = await calculateShopBalance(shop._id as mongoose.Types.ObjectId);
        return {
          shopId: shop._id,
          shopName: shop.name,
          ownerName: shop.ownerName,
          phone: shop.phone,
          marketId: shop.marketId,
          currentBalance: balance,
        };
      })
    );

    const totalOutstanding = results.reduce((sum, s) => sum + s.currentBalance, 0);

    res.status(200).json({ success: true, data: { shops: results, totalOutstanding } });
  } catch (error) {
    console.error('getAllBalances error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/shops/:shopId/password  (admin only)
export const updateShopPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const user = await User.findOne({ shopId });
    if (!user) {
      res.status(404).json({ success: false, message: 'Shop user not found' });
      return;
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('updateShopPassword error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/shops/:id  (admin only)
// Deletes shop + linked user + all orders, payments, ledger entries
export const deleteShop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopId = req.params.id;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    // Delete all related data in parallel
    await Promise.all([
      Order.deleteMany({ shopId }),
      Payment.deleteMany({ shopId }),
      LedgerTransaction.deleteMany({ shopId }),
      User.findOneAndDelete({ shopId }),
    ]);

    await Shop.findByIdAndDelete(shopId);

    console.log(`[DELETE SHOP] Admin "${req.user!.username}" deleted shop "${shop.name}" (${shopId})`);

    res.status(200).json({
      success: true,
      message: `Shop "${shop.name}" and all its data deleted successfully`,
    });
  } catch (error) {
    console.error('deleteShop error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting shop' });
  }
};

// GET /api/shops/:shopId/balance
export const getShopBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;

    if (req.user!.role === 'customer' && req.user!.shopId?.toString() !== shopId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const balance = await calculateShopBalance(shopId);
    res.status(200).json({ success: true, data: { balance } });
  } catch (error) {
    console.error('getShopBalance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
