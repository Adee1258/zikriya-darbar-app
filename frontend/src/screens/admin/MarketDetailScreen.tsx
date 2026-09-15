import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminStackParamList, MarketReport } from '../../types';
import { marketsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
type Route = RouteProp<AdminStackParamList, 'MarketDetail'>;

const MarketDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { marketId } = route.params;

  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(7);

  const loadData = useCallback(async (d: number = days) => {
    try {
      const res = await marketsAPI.getReport(marketId, d);
      setReport(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load market report');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [marketId, days]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDaysChange = (d: number) => {
    setDays(d);
    setLoading(true);
    loadData(d);
  };

  if (loading) return <LoadingScreen message="Loading market report..." />;
  if (!report) return null;

  const { market, totals, shops } = report;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData(); }}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Market Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.marketName}>{market.name}</Text>
            {market.visitDay !== 'None' && (
              <Text style={styles.visitDay}>📅 Visit Day: {market.visitDay}</Text>
            )}
            {market.description ? (
              <Text style={styles.description}>{market.description}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditMarket', { marketId: market._id })}
          >
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Period totals */}
        <View style={styles.totalsGrid}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{shops.length}</Text>
            <Text style={styles.totalLabel}>Shops</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{totals.totalOrders}</Text>
            <Text style={styles.totalLabel}>Orders</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{formatCurrency(totals.totalSales)}</Text>
            <Text style={styles.totalLabel}>Sales</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalValue, { color: COLORS.accent }]}>
              {formatCurrency(totals.totalOutstanding)}
            </Text>
            <Text style={styles.totalLabel}>Balance</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        <Text style={styles.periodLabel}>Report Period:</Text>
        {[7, 14, 30].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.periodBtn, days === d && styles.periodBtnActive]}
            onPress={() => handleDaysChange(d)}
          >
            <Text style={[styles.periodBtnText, days === d && styles.periodBtnTextActive]}>
              {d}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryBarItem}>
          <Text style={styles.summaryBarLabel}>Received</Text>
          <Text style={[styles.summaryBarValue, { color: COLORS.success }]}>
            {formatCurrency(totals.totalReceived)}
          </Text>
        </View>
        <View style={styles.summaryBarDivider} />
        <View style={styles.summaryBarItem}>
          <Text style={styles.summaryBarLabel}>Outstanding</Text>
          <Text style={[styles.summaryBarValue, { color: COLORS.danger }]}>
            {formatCurrency(totals.totalOutstanding)}
          </Text>
        </View>
        <View style={styles.summaryBarDivider} />
        <View style={styles.summaryBarItem}>
          <Text style={styles.summaryBarLabel}>Payments</Text>
          <Text style={styles.summaryBarValue}>{totals.totalPayments}</Text>
        </View>
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>🏪 Shops in this Market</Text>

      {/* Shop Cards */}
      {shops.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No shops in this market"
          subtitle="Assign shops to this market from the Shops screen"
        />
      ) : (
        shops.map((shop) => (
          <TouchableOpacity
            key={String(shop.shopId)}
            style={styles.shopCard}
            onPress={() =>
              navigation.navigate('ShopProfile', {
                shopId: String(shop.shopId),
                shopName: shop.shopName,
              })
            }
            activeOpacity={0.85}
          >
            {/* Balance indicator bar */}
            <View
              style={[
                styles.shopBalanceBar,
                { backgroundColor: shop.currentBalance > 0 ? COLORS.danger : COLORS.success },
              ]}
            />
            <View style={styles.shopCardBody}>
              <View style={styles.shopCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  <Text style={styles.shopOwner}>👤 {shop.ownerName}</Text>
                  <Text style={styles.shopPhone}>📞 {shop.phone}</Text>
                </View>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: shop.currentBalance > 0 ? COLORS.danger : COLORS.success },
                    ]}
                  >
                    {formatCurrency(shop.currentBalance)}
                  </Text>
                </View>
              </View>

              {/* Period stats */}
              <View style={styles.shopStatsRow}>
                <View style={styles.shopStat}>
                  <Text style={styles.shopStatValue}>{shop.periodOrders}</Text>
                  <Text style={styles.shopStatLabel}>Orders</Text>
                </View>
                <View style={styles.shopStatDivider} />
                <View style={styles.shopStat}>
                  <Text style={styles.shopStatValue}>{formatCurrency(shop.periodSales)}</Text>
                  <Text style={styles.shopStatLabel}>Sales</Text>
                </View>
                <View style={styles.shopStatDivider} />
                <View style={styles.shopStat}>
                  <Text style={[styles.shopStatValue, { color: COLORS.success }]}>
                    {formatCurrency(shop.periodReceived)}
                  </Text>
                  <Text style={styles.shopStatLabel}>Received</Text>
                </View>
              </View>

              <Text style={styles.tapHint}>Tap to view full profile →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  // Header
  headerCard: {
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.md, ...SHADOWS.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  marketName: { fontSize: 20, fontFamily: FONTS.heavy, color: COLORS.white, marginBottom: 4 },
  visitDay: { fontSize: 13, fontFamily: FONTS.semiBold, color: 'rgba(255,255,255,0.85)' },
  description: {
    fontSize: 12, fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)', marginTop: 4,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  editBtnText: { color: COLORS.white, fontFamily: FONTS.semiBold, fontSize: 12 },

  totalsGrid: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
  },
  totalItem: { flex: 1, alignItems: 'center' },
  totalDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  totalValue: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.white },
  totalLabel: { fontSize: 10, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Period selector
  periodRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.sm, gap: SPACING.sm,
  },
  periodLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  periodBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  periodBtnTextActive: { color: COLORS.white },

  // Summary bar
  summaryBar: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryBarItem: { flex: 1, alignItems: 'center' },
  summaryBarDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
  summaryBarLabel: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textMuted },
  summaryBarValue: { fontSize: 15, fontFamily: FONTS.heavy, color: COLORS.text, marginTop: 2 },

  sectionTitle: {
    fontSize: 15, fontFamily: FONTS.heavy, color: COLORS.text,
    marginBottom: SPACING.sm, marginTop: SPACING.xs,
  },

  // Shop Card
  shopCard: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
    overflow: 'hidden', ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  shopBalanceBar: { width: 5 },
  shopCardBody: { flex: 1, padding: SPACING.md },
  shopCardTop: { flexDirection: 'row', marginBottom: SPACING.sm },
  shopName: { fontSize: 15, fontFamily: FONTS.heavy, color: COLORS.text },
  shopOwner: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginTop: 2 },
  shopPhone: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },
  balanceBox: { alignItems: 'flex-end', justifyContent: 'center' },
  balanceLabel: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  balanceAmount: { fontSize: 16, fontFamily: FONTS.heavy, marginTop: 2 },

  shopStatsRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  shopStat: { flex: 1, alignItems: 'center' },
  shopStatDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  shopStatValue: { fontSize: 12, fontFamily: FONTS.heavy, color: COLORS.text },
  shopStatLabel: { fontSize: 10, fontFamily: FONTS.medium, color: COLORS.textMuted, marginTop: 1 },

  tapHint: {
    fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.primary,
    textAlign: 'right', marginTop: 4,
  },
});

export default MarketDetailScreen;
