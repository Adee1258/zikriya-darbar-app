import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Alert, StatusBar, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AdminStackParamList, Order, Payment } from '../../types';
import { shopsAPI, ordersAPI, paymentsAPI, expensesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import SectionHeader from '../../components/SectionHeader';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

interface Stats {
  totalShops: number;
  totalOrders: number;
  totalSales: number;
  totalPayments: number;
  totalOutstanding: number;
}

interface TodaySummary {
  ordersCount: number;
  ordersTotal: number;
  paymentsCount: number;
  paymentsTotal: number;
}

const AdminDashboardScreen = () => {
  const navigation = useNavigation<Nav>();
  const { logout, user } = useAuth();

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

  const [stats, setStats] = useState<Stats>({
    totalShops: 0, totalOrders: 0, totalSales: 0, totalPayments: 0, totalOutstanding: 0,
  });
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    ordersCount: 0, ordersTotal: 0, paymentsCount: 0, paymentsTotal: 0,
  });
  const [todayExpensesTotal, setTodayExpensesTotal] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [shopsRes, ordersRes, paymentsRes, balancesRes, todayOrdersRes, todayPaymentsRes, todayExpensesRes] = await Promise.all([
        shopsAPI.getAll().catch(() => ({ data: { data: [] } })),
        ordersAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [], pagination: { total: 0 } } })),
        paymentsAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } })),
        shopsAPI.getAllBalances().catch(() => ({ data: { data: { totalOutstanding: 0 } } })),
        ordersAPI.getAll({ filter: 'today', limit: 200 }).catch(() => ({ data: { data: [] } })),
        paymentsAPI.getAll({ filter: 'today', limit: 200 }).catch(() => ({ data: { data: [] } })),
        expensesAPI.getAll({ filter: 'today', limit: 500 }).catch(() => ({ data: { data: [], meta: { totalAmount: 0 } } })),
      ]);

      const shops = shopsRes?.data?.data || [];
      const orders = ordersRes?.data?.data || [];
      const payments = paymentsRes?.data?.data || [];
      const balances = balancesRes?.data?.data || { totalOutstanding: 0 };

      const tOrders = todayOrdersRes?.data?.data || [];
      const tPayments = todayPaymentsRes?.data?.data || [];

      const totalSales = orders.reduce((s: number, o: Order) => s + (o?.total || 0), 0);
      const totalPaid = payments.reduce((s: number, p: Payment) => s + (p?.amount || 0), 0);

      setStats({
        totalShops: shops.length,
        totalOrders: ordersRes?.data?.pagination?.total || orders.length,
        totalSales,
        totalPayments: totalPaid,
        totalOutstanding: balances?.totalOutstanding || 0,
      });

      setTodaySummary({
        ordersCount: tOrders.length,
        ordersTotal: tOrders.reduce((sum: number, o: Order) => sum + (o?.total || 0), 0),
        paymentsCount: tPayments.length,
        paymentsTotal: tPayments.reduce((sum: number, p: Payment) => sum + (p?.amount || 0), 0),
      });
      setTodayOrders(tOrders);
      setTodayExpensesTotal(todayExpensesRes?.data?.meta?.totalAmount ?? 0);

      setRecentOrders(orders.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh jab bhi dashboard screen pe wapas aao
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const statItems = [
    { label: 'Shops', value: String(stats.totalShops), icon: '🏪', color: COLORS.primary },
    { label: 'Orders', value: String(stats.totalOrders), icon: '📦', color: '#8B5CF6' },
    { label: 'Sales', value: formatCurrency(stats.totalSales), icon: '💰', color: COLORS.primary },
    { label: 'Received', value: formatCurrency(stats.totalPayments), icon: '✅', color: COLORS.success },
  ];

  const quickActions = [
    { label: 'Markets', icon: '🏬', screen: 'Markets' as const },
    { label: 'All Orders', icon: '📋', screen: 'AllOrders' as const },
    { label: 'Payments', icon: '💳', screen: 'AllPayments' as const },
    { label: 'Expenses', icon: '💰', screen: 'Expenses' as const },
    { label: 'Shops', icon: '🏪', screen: 'Shops' as const },
    { label: 'Balances', icon: '⚖️', screen: 'AllBalances' as const },
    { label: 'Products', icon: '🛒', screen: 'Products' as const },
    { label: 'Profile', icon: '⚙️', screen: 'AdminProfile' as const },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decoContainer} pointerEvents="none">
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
        </View>

        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminProfile')}
            activeOpacity={0.8}
            style={{ flex: 1, marginRight: SPACING.sm }}
          >
            <Text style={styles.greeting}>Admin Panel 🛡️</Text>
            <Text style={styles.adminName}>{user?.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={confirmLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Outstanding pill */}
        <LinearGradient
          colors={['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.1)']}
          style={styles.outstandingPill}
        >
          <Text style={styles.outstandingLabel}>⚠️ Total Outstanding</Text>
          <Text style={styles.outstandingValue}>{formatCurrency(stats.totalOutstanding)}</Text>
        </LinearGradient>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
      >
        {/* Today Market Nightly Review Banner */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.todayTitle}>🌙 Today's Market Summary</Text>
              <Text style={styles.todaySubtitle}>Owner Evening Market Review</Text>
            </View>
          </View>

          <View style={styles.todayGrid}>
            <TouchableOpacity
              style={styles.todayItem}
              onPress={() => navigation.navigate('AllOrders')}
              activeOpacity={0.8}
            >
              <Text style={styles.todayItemLabel}>Today's Orders ({todaySummary.ordersCount})</Text>
              <Text style={styles.todayItemValue}>{formatCurrency(todaySummary.ordersTotal)}</Text>
              <Text style={styles.todayLink}>Shop-by-shop view →</Text>
            </TouchableOpacity>

            <View style={styles.todayGridDivider} />

            <TouchableOpacity
              style={styles.todayItem}
              onPress={() => navigation.navigate('AllPayments')}
              activeOpacity={0.8}
            >
              <Text style={styles.todayItemLabel}>Today's Payments ({todaySummary.paymentsCount})</Text>
              <Text style={[styles.todayItemValue, { color: COLORS.success }]}>
                {formatCurrency(todaySummary.paymentsTotal)}
              </Text>
              <Text style={[styles.todayLink, { color: COLORS.success }]}>View collected cash →</Text>
            </TouchableOpacity>
          </View>

          {/* Cash in Hand = Payments collected - Expenses spent today */}
          <View style={styles.cashInHandRow}>
            <View style={styles.cashInHandItem}>
              <Text style={styles.cashInHandLabel}>💳 Cash Collected</Text>
              <Text style={[styles.cashInHandValue, { color: COLORS.success }]}>
                {formatCurrency(todaySummary.paymentsTotal)}
              </Text>
            </View>
            <Text style={styles.cashInHandMinus}>−</Text>
            <TouchableOpacity
              style={styles.cashInHandItem}
              onPress={() => navigation.navigate('Expenses')}
            >
              <Text style={styles.cashInHandLabel}>💰 Expenses</Text>
              <Text style={[styles.cashInHandValue, { color: COLORS.danger }]}>
                {formatCurrency(todayExpensesTotal)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.cashInHandEquals}>=</Text>
            <View style={styles.cashInHandItem}>
              <Text style={styles.cashInHandLabel}>🤑 Cash in Hand</Text>
              <Text style={[
                styles.cashInHandValue,
                { color: todaySummary.paymentsTotal - todayExpensesTotal >= 0 ? COLORS.primary : COLORS.danger },
              ]}>
                {formatCurrency(todaySummary.paymentsTotal - todayExpensesTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statItems.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: `${s.color}15` }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
              </View>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll} contentContainerStyle={styles.actionsContent}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.actionChip}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{item.icon}</Text>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Orders */}
        <SectionHeader title="Recent Orders" actionLabel="View All →" onAction={() => navigation.navigate('AllOrders')} />
        {recentOrders.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No orders yet</Text></View>
        ) : (
          recentOrders.map((order) => (
            <TouchableOpacity key={order._id} activeOpacity={0.8}
              onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}>
              <View style={styles.listCard}>
                <View style={[styles.listIconBg, { backgroundColor: COLORS.primaryLight }]}>
                  <Text style={styles.listIcon}>📦</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{order.orderNumber}</Text>
                  <Text style={styles.listSub}>
                    {typeof order.shopId === 'object' ? (order.shopId as { name: string }).name : '—'} • {formatDate(order.createdAt)}
                  </Text>
                </View>
                <Text style={styles.listAmount}>{formatCurrency(order.total)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Payments */}
        <SectionHeader title="Recent Payments" actionLabel="View All →" onAction={() => navigation.navigate('AllPayments')} />
        {recentPayments.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No payments yet</Text></View>
        ) : (
          recentPayments.map((payment) => (
            <View key={payment._id} style={styles.listCard}>
              <View style={[styles.listIconBg, { backgroundColor: COLORS.successLight }]}>
                <Text style={styles.listIcon}>💳</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>
                  {typeof payment.shopId === 'object' ? (payment.shopId as { name: string }).name : '—'}
                </Text>
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
  header: {
    paddingTop: 54, paddingBottom: 30, paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl, borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  decoContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: BORDER_RADIUS.xl, borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  decoCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -50,
  },
  decoCircle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(245,158,11,0.1)', bottom: -20, left: -40,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  adminName: { fontSize: 22, fontFamily: FONTS.heavy, color: COLORS.white, flexShrink: 1 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: { color: COLORS.white, fontFamily: FONTS.semiBold, fontSize: 12 },
  outstandingPill: {
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  outstandingLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.accent },
  outstandingValue: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.accent },

  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  // Today Nightly Card
  todayCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  todayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  todayTitle: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.text },
  todaySubtitle: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  todayGrid: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
  },
  todayItem: { flex: 1 },
  todayItemLabel: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  todayItemValue: { fontSize: 17, fontFamily: FONTS.heavy, color: COLORS.primary, marginTop: 4 },
  todayLink: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary, marginTop: 4 },
  todayGridDivider: { width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  // Cash in Hand row
  cashInHandRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cashInHandItem: { flex: 1, alignItems: 'center' },
  cashInHandLabel: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginBottom: 2 },
  cashInHandValue: { fontSize: 13, fontFamily: FONTS.heavy },
  cashInHandMinus: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.textMuted, marginHorizontal: 2 },
  cashInHandEquals: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.textMuted, marginHorizontal: 2 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  statCard: {
    width: '48%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  statIconBg: {
    width: 40, height: 40, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  statIcon: { fontSize: 20 },
  statLabel: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: FONTS.heavy, letterSpacing: -0.5 },
  actionsScroll: { marginBottom: SPACING.md },
  actionsContent: { paddingBottom: SPACING.sm, gap: SPACING.sm },
  actionChip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', width: 86,
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.text, textAlign: 'center' },
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  listIconBg: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  listIcon: { fontSize: 20 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  listSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  listAmount: { fontSize: 15, fontFamily: FONTS.heavy, color: COLORS.text },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md, ...SHADOWS.xs,
  },
  emptyText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textMuted },
});

export default AdminDashboardScreen;
