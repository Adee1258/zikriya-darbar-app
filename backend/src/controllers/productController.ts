import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// GET /api/products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const products = await Product.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('getAllProducts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/products  (admin only)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, unit, defaultRate, status } = req.body;

    if (!name || !unit || defaultRate === undefined) {
      res.status(400).json({ success: false, message: 'name, unit, and defaultRate are required' });
      return;
    }

    const existing = await Product.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Product with this name already exists' });
      return;
    }

    const product = await Product.create({ name, unit, defaultRate, status: status || 'active' });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/products/:id  (admin only)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, unit, defaultRate, status } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, unit, defaultRate, status },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
