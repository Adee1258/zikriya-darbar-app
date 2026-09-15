import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Shop from '../models/Shop';
import { AuthRequest } from '../middleware/auth';

const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn } as jwt.SignOptions);
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    const token = signToken(user._id.toString(), user.role);

    // If customer, also return shop info
    let shopInfo = null;
    if (user.role === 'customer' && user.shopId) {
      shopInfo = await Shop.findById(user.shopId).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          shopId: user.shopId,
        },
        shop: shopInfo,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let shopInfo = null;

    if (user.role === 'customer' && user.shopId) {
      shopInfo = await Shop.findById(user.shopId).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          shopId: user.shopId,
        },
        shop: shopInfo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/register (admin creates admin account; normally only used for seeding)
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Username already taken' });
      return;
    }

    const user = await User.create({
      name,
      username: username.toLowerCase().trim(),
      password,
      role: 'admin',
      shopId: null,
    });

    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// PUT /api/auth/profile (protected)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, username } = req.body;
    const userId = req.user!._id;

    if (!name || !username) {
      res.status(400).json({ success: false, message: 'Name and Username are required' });
      return;
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check username collision
    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Username is already taken' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.name = name.trim();
    user.username = cleanUsername;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        shopId: user.shopId,
      },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
};

// PUT /api/auth/password (protected)
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: 'Server error while changing password' });
  }
};
