import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../types';
import { COLORS } from '../constants';

import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
import CustomerOrderDetailsScreen from '../screens/customer/CustomerOrderDetailsScreen';
import MyPaymentsScreen from '../screens/customer/MyPaymentsScreen';
import AccountHistoryScreen from '../screens/customer/AccountHistoryScreen';
import MyProfileScreen from '../screens/customer/MyProfileScreen';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

const CustomerNavigator = () => (
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
      name="CustomerDashboard"
      component={CustomerDashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
    <Stack.Screen
      name="OrderDetails"
      component={CustomerOrderDetailsScreen}
      options={{ title: 'Order Details' }}
    />
    <Stack.Screen name="MyPayments" component={MyPaymentsScreen} options={{ title: 'My Payments' }} />
    <Stack.Screen
      name="AccountHistory"
      component={AccountHistoryScreen}
      options={{ title: 'Account History' }}
    />
    <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

export default CustomerNavigator;
