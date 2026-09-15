import { Response } from 'express';
import LedgerTransaction from '../models/LedgerTransaction';
import { AuthRequest } from '../middleware/auth';
import { calculateShopBalance } from '../utils/balanceHelper';

// GET /api/shops/:shopId/ledger
export const getShopLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;

    // Customers can only access their own ledger
    if (req.user!.role === 'customer') {
      if (req.user!.shopId?.toString() !== shopId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    const transactions = await LedgerTransaction.find({ shopId })
      .sort({ createdAt: 1 }) // chronological order for account history
      .lean();

    const currentBalance = await calculateShopBalance(shopId);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        currentBalance,
      },
    });
  } catch (error) {
    console.error('getShopLedger error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
