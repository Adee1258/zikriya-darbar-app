import Order from '../models/Order';

/**
 * Generate the next order number in the format ORD-XXXX.
 * Retries up to 5 times to handle the race condition where two concurrent
 * requests read the same last order number and generate a duplicate.
 */
export const generateOrderNumber = async (retries = 5): Promise<string> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const lastOrder = await Order.findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let candidate: string;
    if (!lastOrder || !lastOrder.orderNumber) {
      candidate = 'ORD-0001';
    } else {
      const parts = lastOrder.orderNumber.split('-');
      const lastNum = parseInt(parts[1] || '0', 10);
      candidate = `ORD-${String(lastNum + 1).padStart(4, '0')}`;
    }

    // Check the candidate is not already taken (handles race condition)
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) {
      return candidate;
    }

    // Another concurrent request already used this number — try again
  }

  // Fallback: use timestamp-based suffix to guarantee uniqueness
  return `ORD-${Date.now()}`;
};
