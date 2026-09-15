import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types';
import { COLORS } from '../constants';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ShopsScreen from '../screens/admin/ShopsScreen';
import AddShopScreen from '../screens/admin/AddShopScreen';
import EditShopScreen from '../screens/admin/EditShopScreen';
import ShopProfileScreen from '../screens/admin/ShopProfileScreen';
import ProductsScreen from '../screens/admin/ProductsScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import EditProductScreen from '../screens/admin/EditProductScreen';
import NewOrderScreen from '../screens/admin/NewOrderScreen';
import OrderDetailsScreen from '../screens/admin/OrderDetailsScreen';
import AllOrdersScreen from '../screens/admin/AllOrdersScreen';
import AllPaymentsScreen from '../screens/admin/AllPaymentsScreen';
import AddPaymentScreen from '../screens/admin/AddPaymentScreen';
import AllBalancesScreen from '../screens/admin/AllBalancesScreen';
import ShopLedgerScreen from '../screens/admin/ShopLedgerScreen';
import PaymentDetailsScreen from '../screens/admin/PaymentDetailsScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import MarketsScreen from '../screens/admin/MarketsScreen';
import AddEditMarketScreen from '../screens/admin/AddEditMarketScreen';
import MarketDetailScreen from '../screens/admin/MarketDetailScreen';
import ExpensesScreen from '../screens/admin/ExpensesScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.white },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
      headerTitleAlign: 'center',
      headerShadowVisible: true,
      headerBackTitleVisible: false,
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Shops" component={ShopsScreen} options={{ title: 'Shops' }} />
    <Stack.Screen name="AddShop" component={AddShopScreen} options={{ title: 'Add Shop' }} />
    <Stack.Screen name="EditShop" component={EditShopScreen} options={{ title: 'Edit Shop' }} />
    <Stack.Screen
      name="ShopProfile"
      component={ShopProfileScreen}
      options={({ route }) => ({ title: route.params.shopName })}
    />
    <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
    <Stack.Screen
      name="NewOrder"
      component={NewOrderScreen}
      options={{ title: 'New Order' }}
    />
    <Stack.Screen
      name="OrderDetails"
      component={OrderDetailsScreen}
      options={{ title: 'Order Details' }}
    />
    <Stack.Screen name="AllOrders" component={AllOrdersScreen} options={{ title: 'All Orders' }} />
    <Stack.Screen name="AllPayments" component={AllPaymentsScreen} options={{ title: 'All Payments' }} />
    <Stack.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: 'Add Payment' }} />
    <Stack.Screen name="AllBalances" component={AllBalancesScreen} options={{ title: 'All Balances' }} />
    <Stack.Screen
      name="ShopLedger"
      component={ShopLedgerScreen}
      options={({ route }) => ({ title: `${route.params.shopName} — Ledger` })}
    />
    <Stack.Screen
      name="PaymentDetails"
      component={PaymentDetailsScreen}
      options={{ title: 'Payment Details' }}
    />
    <Stack.Screen
      name="AdminProfile"
      component={AdminProfileScreen}
      options={{ title: 'My Profile & Security' }}
    />
    {/* Market Screens */}
    <Stack.Screen
      name="Markets"
      component={MarketsScreen}
      options={{ title: 'Markets' }}
    />
    <Stack.Screen
      name="AddMarket"
      component={AddEditMarketScreen}
      options={{ title: 'Add Market' }}
    />
    <Stack.Screen
      name="EditMarket"
      component={AddEditMarketScreen}
      options={{ title: 'Edit Market' }}
    />
    <Stack.Screen
      name="MarketDetail"
      component={MarketDetailScreen}
      options={({ route }) => ({ title: route.params.marketName })}
    />
    <Stack.Screen
      name="Expenses"
      component={ExpensesScreen}
      options={{ title: 'Expenses' }}
    />
  </Stack.Navigator>
);

export default AdminNavigator;
