/**
 * Run this once to seed the database:
 *   npx ts-node src/utils/seeder.ts
 *
 * Creates:
 *   - Admin user (admin / admin123)
 *   - Default products (Mishri, Mirch, Haldi, Dhania, Zeera, Namak)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';

const PRODUCTS = [
  { name: 'Mishri',  unit: 'KG',     defaultRate: 400 },
  { name: 'Mirch',   unit: 'KG',     defaultRate: 800 },
  { name: 'Haldi',   unit: 'KG',     defaultRate: 600 },
  { name: 'Dhania',  unit: 'KG',     defaultRate: 350 },
  { name: 'Zeera',   unit: 'KG',     defaultRate: 1200 },
  { name: 'Namak',   unit: 'KG',     defaultRate: 60 },
  { name: 'Kali Mirch', unit: 'KG',  defaultRate: 2000 },
  { name: 'Laung',   unit: 'KG',     defaultRate: 3000 },
  { name: 'Elaichi', unit: 'KG',     defaultRate: 4000 },
  { name: 'Darchini',unit: 'KG',     defaultRate: 1500 },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wholesale_db';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    await User.create({
      name: 'Administrator',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      shopId: null,
    });
    console.log('Admin created  →  username: admin  /  password: admin123');
  } else {
    console.log('Admin already exists, skipping.');
  }

  // ── Products ────────────────────────────────────────────────────────────────
  let created = 0;
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await Product.create({ ...p, status: 'active' });
      created++;
    }
  }
  console.log(`Products seeded: ${created} new / ${PRODUCTS.length - created} already existed`);

  await mongoose.disconnect();
  console.log('\nSeeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
