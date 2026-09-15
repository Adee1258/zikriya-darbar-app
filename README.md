# Zikriya Darbar — Wholesale Shop Management App

React Native + Expo + Node.js + MongoDB

---

## Project Structure

```
├── backend/          Node.js + Express + TypeScript API
└── frontend/         React Native + Expo + TypeScript App
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI: `npm install -g expo-cli`
- Android Studio / Expo Go app on phone

---

## Backend Setup

```bash
cd backend
npm install
```

Copy env file and edit if needed:
```bash
# Already created as .env — edit MONGODB_URI if using Atlas
```

Seed the database (creates admin account + products):
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

Server runs on: http://localhost:5000
Health check: http://localhost:5000/api/health

### Admin Login Credentials (after seeding)
- Username: `admin`
- Password: `admin123`

---

## Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
```

### Configure API URL

Edit `src/constants/index.ts`:

```ts
// For Android emulator:
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

// For iOS simulator:
export const API_BASE_URL = 'http://localhost:5000/api';

// For physical device (use your machine's local IP):
export const API_BASE_URL = 'http://192.168.1.xxx:5000/api';
```

Start the Expo app:
```bash
npx expo start
```

Scan the QR code with Expo Go app, or press `a` for Android emulator.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/register | Public | Create admin |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/shops | Admin | All shops |
| POST | /api/shops | Admin | Create shop |
| GET | /api/shops/:id | Auth | Shop details |
| PUT | /api/shops/:id | Admin | Update shop |
| GET | /api/shops/:id/balance | Auth | Shop balance |
| GET | /api/shops/:id/orders | Auth | Shop orders |
| GET | /api/shops/:id/payments | Auth | Shop payments |
| GET | /api/shops/:id/ledger | Auth | Shop ledger |
| GET | /api/balances | Admin | All balances |
| GET | /api/products | Auth | All products |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| GET | /api/orders | Admin | All orders |
| POST | /api/orders | Admin | Create order |
| GET | /api/orders/:id | Auth | Order detail |
| GET | /api/payments | Admin | All payments |
| POST | /api/payments | Admin | Create payment |
| GET | /api/payments/:id | Auth | Payment detail |

---

## Balance Formula

```
Balance = Opening Balance + Total Orders - Total Payments
```

This formula is used everywhere — dashboard, shop profile, ledger.

---

## Acceptance Test Flow

1. Seed DB → admin login
2. Add shop: **Al Madina Store**, opening balance Rs. 35,000
3. Add order: Mishri 20kg×400 + Mirch 10kg×800 + Haldi 5kg×600 = **Rs. 19,000**
4. Balance → **Rs. 54,000**
5. Add payment: **Rs. 20,000**
6. Balance → **Rs. 34,000**
7. Customer logs in → sees Rs. 34,000, order, payment, account history
8. Admin → All Orders → sees order without opening shop
9. Admin → All Balances → Al Madina = Rs. 34,000
