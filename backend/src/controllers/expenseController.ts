import { Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

// Helper — parse date string safely
const parseDate = (s: string | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Build date match from query params (dateFrom / dateTo)
const buildDateMatch = (
  dateFrom: string | undefined,
  dateTo: string | undefined
): Record<string, unknown> => {
  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (!from && !to) return {};

  const range: Record<string, Date> = {};
  if (from) {
    from.setHours(0, 0, 0, 0);
    range.$gte = from;
  }
  if (to) {
    to.setHours(23, 59, 59, 999);
    range.$lte = to;
  }
  return { date: range };
};

// ─── GET /api/expenses ───────────────────────────────────────────────────────
export const getAllExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      dateFrom,
      dateTo,
      category,
      filter,
      page = '1',
      limit = '200',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(500, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Build match
    const match: Record<string, unknown> = {};

    // Named quick-filters
    const now = new Date();
    if (filter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      match.date = { $gte: start, $lte: end };
    } else if (filter === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
      match.date = { $gte: start };
    } else if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      match.date = { $gte: start };
    } else {
      // Custom date range
      const rangeMatch = buildDateMatch(dateFrom, dateTo);
      Object.assign(match, rangeMatch);
    }

    if (category && category !== 'all') {
      match.category = category;
    }

    const [expenses, totalResult, sumResult] = await Promise.all([
      Expense.find(match)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name')
        .lean(),
      Expense.countDocuments(match),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    const totalAmount = sumResult[0]?.totalAmount ?? 0;

    res.status(200).json({
      success: true,
      data: expenses,
      meta: { totalAmount },
      pagination: {
        total: totalResult,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalResult / limitNum),
      },
    });
  } catch (error) {
    console.error('getAllExpenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/expenses ──────────────────────────────────────────────────────
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, amount, category, date, notes } = req.body;

    if (!title || !amount || !date) {
      res.status(400).json({ success: false, message: 'title, amount, and date are required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount: parsedAmount,
      category: category || 'Other',
      date: parsedDate,
      notes: notes?.trim() || '',
      createdBy: req.user!._id,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating expense' });
  }
};

// ─── PUT /api/expenses/:id ───────────────────────────────────────────────────
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, amount, category, date, notes } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (amount !== undefined) {
      const n = Number(amount);
      if (isNaN(n) || n <= 0) {
        res.status(400).json({ success: false, message: 'Amount must be positive' });
        return;
      }
      updateData.amount = n;
    }
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) {
      const d = parseDate(date);
      if (!d) { res.status(400).json({ success: false, message: 'Invalid date' }); return; }
      updateData.date = d;
    }
    if (notes !== undefined) updateData.notes = notes.trim();

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE /api/expenses/:id ────────────────────────────────────────────────
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/expenses/summary ───────────────────────────────────────────────
// Category-wise breakdown for a period
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, filter } = req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    const now = new Date();

    if (filter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      match.date = { $gte: start, $lte: new Date(start.getTime() + 86400000 - 1) };
    } else if (filter === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
      match.date = { $gte: start };
    } else if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      match.date = { $gte: start };
    } else {
      Object.assign(match, buildDateMatch(dateFrom, dateTo));
    }

    const breakdown = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = breakdown.reduce((s, c) => s + c.total, 0);

    res.status(200).json({
      success: true,
      data: { breakdown, grandTotal },
    });
  } catch (error) {
    console.error('getExpenseSummary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
