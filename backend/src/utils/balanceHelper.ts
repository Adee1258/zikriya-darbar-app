import Shop from '../models/Shop';
import Order from '../models/Order';
import Payment from '../models/Payment';
import mongoose from 'mongoose';

/**
 * Canonical balance formula:
 *   balance = openingBalance + totalOrders - totalPayments
 *
 * This is the single source of truth used everywhere.
 */
export const calculateShopBalance = async (
  shopId: mongoose.Types.ObjectId | string
): Promise<number> => {
  const shop = await Shop.findById(shopId).lean();
  if (!shop) throw new Error('Shop not found');

  const orderAgg = await Order.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId.toString()), status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  const paymentAgg = await Payment.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId.toString()) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalOrders = orderAgg[0]?.total ?? 0;
  const totalPayments = paymentAgg[0]?.total ?? 0;

  return shop.openingBalance + totalOrders - totalPayments;
};

/**
 * Get the last balanceAfter value from the ledger for a shop.
 * Used when appending a new ledger entry.
 */
export const getLastLedgerBalance = async (
  shopId: mongoose.Types.ObjectId | string
): Promise<number> => {
  const { default: LedgerTransaction } = await import('../models/LedgerTransaction');

  const last = await LedgerTransaction.findOne(
    { shopId: new mongoose.Types.ObjectId(shopId.toString()) },
    { balanceAfter: 1 }
  )
    .sort({ createdAt: -1 })
    .lean();

  if (last) return last.balanceAfter;

  // No ledger entries yet — use opening balance
  const shop = await Shop.findById(shopId).lean();
  return shop?.openingBalance ?? 0;
};
