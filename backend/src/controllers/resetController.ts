import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Payment from '../models/Payment';
import LedgerTransaction from '../models/LedgerTransaction';
import Shop from '../models/Shop';
import User from '../models/User';
import Market from '../models/Market';
import Expense from '../models/Expense';

/**
 * DELETE /api/admin/reset
 * Admin only — wipes all transactional + shop + market + expense data.
 * Keeps only admin user accounts intact.
 */
export const resetAllData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [orders, payments, ledger, shops, users, markets, expenses] = await Promise.all([
      Order.deleteMany({}),
      Payment.deleteMany({}),
      LedgerTransaction.deleteMany({}),
      Shop.deleteMany({}),
      User.deleteMany({ role: 'customer' }),
      Market.deleteMany({}),
      Expense.deleteMany({}),
    ]);

    console.log(
      `[RESET] Admin "${req.user!.username}" wiped all data — ` +
      `orders:${orders.deletedCount} payments:${payments.deletedCount} ` +
      `ledger:${ledger.deletedCount} shops:${shops.deletedCount} ` +
      `users:${users.deletedCount} markets:${markets.deletedCount} ` +
      `expenses:${expenses.deletedCount}`
    );

    res.status(200).json({
      success: true,
      message: 'All data has been reset successfully.',
      deleted: {
        orders: orders.deletedCount,
        payments: payments.deletedCount,
        ledgerEntries: ledger.deletedCount,
        shops: shops.deletedCount,
        customerUsers: users.deletedCount,
        markets: markets.deletedCount,
        expenses: expenses.deletedCount,
      },
    });
  } catch (error) {
    console.error('resetAllData error:', error);
    res.status(500).json({ success: false, message: 'Server error during reset.' });
  }
};
