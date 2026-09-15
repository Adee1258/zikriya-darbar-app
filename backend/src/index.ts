import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import resetRoutes from './routes/resetRoutes';
import marketRoutes from './routes/marketRoutes';
import expenseRoutes from './routes/expenseRoutes';
import { getAllBalances } from './controllers/shopController';
import { protect, adminOnly } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Wholesale API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', resetRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/expenses', expenseRoutes);

// All balances (admin)
app.get('/api/balances', protect, adminOnly, getAllBalances);

// 404 & Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
