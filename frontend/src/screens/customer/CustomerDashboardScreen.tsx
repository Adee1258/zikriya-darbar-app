import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList, Order, Payment } from '../../types';
import { ordersAPI, paymentsAPI, shopsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const CustomerDashboardScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user, shop, logout } = useAuth();
  const shopId = user?.shopId || '';

  const confirmLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign Out — Are you sure?')) {
        logout().catch(console.error);
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout().catch(console.error) },
      ]);
    }
  }, [logout]);

  const [balance, setBalance] = useState(shop?.currentBalance ?? 0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    try {
      const [balRes, ordRes, payRes] = await Promise.all([
        shopsAPI.getBalance(shopId),
        ordersAPI.getByShop(shopId),
        paymentsAPI.getByShop(shopId),
      ]);
      setBalance(balRes.data.data.balance);
      setRecentOrders((ordRes.data.data || []).slice(0, 3));
      setRecentPayments((payRes.data.data || []).slice(0, 3));
    } catch {
      console.error('Dashboard load error');
    } finally {
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const menuItems = [
    { icon: '📦', label: 'My Orders', screen: 'MyOrders' as const, color: COLORS.primary },
    { icon: '💳', label: 'Payments', screen: 'MyPayments' as const, color: COLORS.success },
    { icon: '📊', label: 'Account History', screen: 'AccountHistory' as const, color: COLORS.accent },
    { icon: '👤', label: 'My Profile', screen: 'MyProfile' as const, color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Deco circles clipped separately so they don't block touches */}
        <View style={styles.decoContainer} pointerEvents="none">
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
        </View>

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Assalam o Alaikum 👋</Text>
            <Text style={styles.shopName}>{shop?.name || user?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={confirmLogout}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card inside header */}
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
          style={styles.balanceCard}
        >
          <View style={styles.balancePill}>
            <Text style={styles.balancePillText}>CURRENT BALANCE</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceNote}>Total amount you owe</Text>
        </LinearGradient>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: `${item.color}15` }]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={[styles.menuDot, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <SectionHeader title="Recent Orders" actionLabel="View All →" onAction={() => navigation.navigate('MyOrders')} />
        {recentOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <TouchableOpacity key={order._id} activeOpacity={0.8} onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}>
              <View style={styles.listCard}>
                <View style={[styles.listIconBg, { backgroundColor: COLORS.primaryLight }]}>
                  <Text style={styles.listIcon}>📦</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{order.orderNumber}</Text>
                  <Text style={styles.listSub}>{formatDate(order.createdAt)}</Text>
                </View>
                <Text style={styles.listAmount}>{formatCurrency(order.total)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Payments */}
        <SectionHeader title="Recent Payments" actionLabel="View All →" onAction={() => navigation.navigate('MyPayments')} />
        {recentPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No payments yet</Text>
          </View>
        ) : (
          recentPayments.map((payment) => (
            <View key={payment._id} style={styles.listCard}>
              <View style={[styles.listIconBg, { backgroundColor: COLORS.successLight }]}>
                <Text style={styles.listIcon}>💳</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>Payment Received</Text>
                <Text style={styles.listSub}>{payment.paymentMethod} • {formatDate(payment.createdAt)}</Text>
              </View>
              <Text style={[styles.listAmount, { color: COLORS.success }]}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: {
    paddingTop: 54, paddingBottom: 36,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  decoContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: BORDER_RADIUS.xl, borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  decoCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40,
  },
  decoCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(245,158,11,0.12)', bottom: 20, left: -30,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: SPACING.lg, zIndex: 2,
  },
  greeting: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  shopName: { fontSize: 22, fontFamily: FONTS.heavy, color: COLORS.white },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: { color: COLORS.white, fontFamily: FONTS.semiBold, fontSize: 12 },
  balanceCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  balancePill: {
    backgroundColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  balancePillText: {
    fontSize: 10, fontFamily: FONTS.bold, color: COLORS.accent, letterSpacing: 1.5,
  },
  balanceAmount: {
    fontSize: 40, fontFamily: FONTS.heavy, color: COLORS.white,
    marginBottom: 4, letterSpacing: -1,
  },
  balanceNote: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.65)' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  menuGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  menuItem: {
    width: '48%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  menuIconWrapper: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  menuIcon: { fontSize: 26 },
  menuLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text, textAlign: 'center' },
  menuDot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 8,
  },
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  listIconBg: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md,
  },
  listIcon: { fontSize: 20 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  listSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  listAmount: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.text },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textMuted },
});

export default CustomerDashboardScreen;
