// ─── Expense ──────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'Petrol'
  | 'Loading'
  | 'Food'
  | 'Repair'
  | 'Salary'
  | 'Rent'
  | 'Utility'
  | 'Other';

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryBreakdown {
  _id: ExpenseCategory;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  breakdown: ExpenseSummaryBreakdown[];
  grandTotal: number;
}

// ─── Market ───────────────────────────────────────────────────────────────────
export type VisitDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'
  | 'None';

export interface Market {
  _id: string;
  name: string;
  visitDay: VisitDay;
  description: string;
  isActive: boolean;
  shopCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketWithShops extends Market {
  shops: Shop[];
}

export interface MarketShopReport {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  periodOrders: number;
  periodSales: number;
  periodPayments: number;
  periodReceived: number;
  currentBalance: number;
}

export interface MarketReportTotals {
  totalOrders: number;
  totalSales: number;
  totalPayments: number;
  totalReceived: number;
  totalOutstanding: number;
}

export interface MarketReport {
  market: Market;
  days: number;
  since: string;
  shops: MarketShopReport[];
  totals: MarketReportTotals;
}

export interface AllMarketsReportEntry {
  marketId: string | null;
  marketName: string;
  visitDay: VisitDay;
  shopCount: number;
  periodOrders: number;
  periodSales: number;
  periodReceived: number;
  totalOutstanding: number;
}

export interface AllMarketsReport {
  days: number;
  since: string;
  markets: AllMarketsReportEntry[];
  grandTotals: {
    totalShops: number;
    totalOrders: number;
    totalSales: number;
    totalReceived: number;
    totalOutstanding: number;
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'customer';

export interface User {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  shopId: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  shop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
export interface Shop {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  userId: string;
  marketId: { _id: string; name: string; visitDay: VisitDay } | string | null;
  openingBalance: number;
  isActive: boolean;
  currentBalance?: number;
  username?: string;
  summary?: ShopSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSummary {
  totalOrders: number;
  totalPurchased: number;
  totalPaid: number;
  currentBalance: number;
}

export interface ShopBalance {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  marketId: { _id: string; name: string; visitDay: VisitDay } | string | null;
  currentBalance: number;
}

export interface AllBalancesResponse {
  shops: ShopBalance[];
  totalOutstanding: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductUnit = 'KG' | 'Packet' | 'Bag' | 'Box' | 'Piece';

export interface Product {
  _id: string;
  name: string;
  unit: ProductUnit;
  defaultRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  shopId: string | Shop;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'confirmed' | 'cancelled';
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  // populated by aggregation
  shop?: { name: string; ownerName: string };
  itemCount?: number;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Other';

export interface Payment {
  _id: string;
  shopId: string | Shop;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────
export type LedgerType = 'OPENING_BALANCE' | 'ORDER' | 'PAYMENT';

export interface LedgerTransaction {
  _id: string;
  shopId: string;
  type: LedgerType;
  referenceId: string | null;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  createdBy: string | null;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Navigation Params ────────────────────────────────────────────────────────
export type AdminStackParamList = {
  AdminDashboard: undefined;
  Shops: undefined;
  AddShop: undefined;
  EditShop: { shopId: string };
  ShopProfile: { shopId: string; shopName: string };
  Products: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  NewOrder: { shopId: string; shopName: string };
  OrderDetails: { orderId: string };
  AllOrders: undefined;
  AllPayments: undefined;
  AddPayment: { shopId: string; shopName: string; currentBalance: number };
  AllBalances: undefined;
  ShopLedger: { shopId: string; shopName: string };
  PaymentDetails: { paymentId: string };
  AdminProfile: undefined;
  // Market screens
  Markets: undefined;
  AddMarket: undefined;
  EditMarket: { marketId: string };
  MarketDetail: { marketId: string; marketName: string };
  // Expense screen
  Expenses: undefined;
};

export type CustomerStackParamList = {
  CustomerDashboard: undefined;
  MyOrders: undefined;
  OrderDetails: { orderId: string };
  MyPayments: undefined;
  AccountHistory: undefined;
  MyProfile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  AdminRoot: undefined;
  CustomerRoot: undefined;
};
