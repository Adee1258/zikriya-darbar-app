import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { Payment, Shop } from '../../types';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import DateRangePicker from '../../components/DateRangePicker';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type ViewMode = 'today' | 'history';
type HistoryFilter = '' | 'week' | 'month' | 'custom';

const HISTORY_FILTERS = [
  { label: 'All History', value: '' as HistoryFilter },
  { label: 'This Week', value: 'week' as HistoryFilter },
  { label: 'This Month', value: 'month' as HistoryFilter },
  { label: '📅 Custom', value: 'custom' as HistoryFilter },
];

interface PaymentShopGroup {
  shopId: string;
  shopName: string;
  totalReceived: number;
  payments: Payment[];
}

const AllPaymentsScreen = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async (
    mode: ViewMode = viewMode,
    hFilter: HistoryFilter = historyFilter,
    q: string = search,
    from: string = dateFrom,
    to: string = dateTo,
  ) => {
    try {
      const params: Parameters<typeof paymentsAPI.getAll>[0] = {
        search: q || undefined,
        limit: 200,
      };
      if (mode === 'today') {
        params.filter = 'today';
      } else if (hFilter === 'custom') {
        if (from) params.dateFrom = from;
        if (to) params.dateTo = to;
      } else if (hFilter) {
        params.filter = hFilter;
      }
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data || []);
    } catch {
      console.error('Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewMode, historyFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [viewMode, historyFilter]);

  const handleSearch = (text: string) => {
    setSearch(text);
    loadData(viewMode, historyFilter, text);
  };

  const handleCustomSearch = () => {
    if (!dateFrom && !dateTo) { Alert.alert('Error', 'Kam az kam ek date darj karo'); return; }
    setLoading(true);
    loadData('history', 'custom', search, dateFrom, dateTo);
  };

  // Group today's payments by Shop Name
  const shopGroups = useMemo<PaymentShopGroup[]>(() => {
    if (viewMode !== 'today') return [];

    const map = new Map<string, PaymentShopGroup>();

    payments.forEach((payment) => {
      const shopObj = typeof payment.shopId === 'object' ? (payment.shopId as unknown as Shop) : null;
      const shopName = shopObj?.name || 'Unknown Shop';
      const shopIdKey = shopObj?._id || String(payment.shopId);

      if (!map.has(shopIdKey)) {
        map.set(shopIdKey, {
          shopId: shopIdKey,
          shopName,
          totalReceived: 0,
          payments: [],
        });
      }

      const group = map.get(shopIdKey)!;
      group.payments.push(payment);
      group.totalReceived += payment.amount;
    });

    return Array.from(map.values());
  }, [payments, viewMode]);

  // Overall today's summary
  const todaySummary = useMemo(() => {
    const totalPaymentsCount = payments.length;
    const totalReceivedSum = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalShopsCount = shopGroups.length;
    return { totalPaymentsCount, totalReceivedSum, totalShopsCount };
  }, [payments, shopGroups]);

  if (loading) return <LoadingScreen message="Loading payments..." />;

  return (
    <View style={styles.container}>
      {/* View Mode Tabs */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'today' && styles.modeTabActive]}
          onPress={() => { setViewMode('today'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'today' && styles.modeTabTextActive]}>
            ☀️ Today's Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'history' && styles.modeTabActive]}
          onPress={() => { setViewMode('history'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'history' && styles.modeTabTextActive]}>
            📜 Payment History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search shop name or notes..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* TODAY'S DAILY PAYMENTS VIEW */}
      {viewMode === 'today' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.success} />
          }
        >
          {/* Today KPI Card */}
          <View style={styles.todaySummaryCard}>
            <Text style={styles.summaryTitle}>💳 Today's Cash Collection</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalShopsCount}</Text>
                <Text style={styles.summaryStatLabel}>Shops Paid</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalPaymentsCount}</Text>
                <Text style={styles.summaryStatLabel}>Payments Received</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, { color: COLORS.successLight }]}>
                  {formatCurrency(todaySummary.totalReceivedSum)}
                </Text>
                <Text style={styles.summaryStatLabel}>Total Received</Text>
              </View>
            </View>
          </View>

          {shopGroups.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No Payments Collected Today"
              subtitle="Payments collected today from shops will appear here grouped shop-by-shop"
            />
          ) : (
            shopGroups.map((group) => (
              <View key={group.shopId} style={styles.shopGroupContainer}>
                {/* Header */}
                <View style={styles.shopGroupHeader}>
                  <View style={styles.shopHeaderTitleRow}>
                    <Text style={styles.shopHeaderIcon}>🏪</Text>
                    <Text style={styles.shopHeaderName}>{group.shopName}</Text>
                  </View>
                  <View style={styles.shopHeaderBadge}>
                    <Text style={styles.shopHeaderBadgeText}>
                      Received: {formatCurrency(group.totalReceived)}
                    </Text>
                  </View>
                </View>

                {/* Payments */}
                {group.payments.map((item) => (
                  <View key={item._id} style={styles.paymentCard}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <View style={styles.methodTag}>
                          <Text style={styles.methodTagText}>💳 {item.paymentMethod}</Text>
                        </View>
                        {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}
                        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                      </View>
                      <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* PAYMENT HISTORY VIEW */
        <View style={{ flex: 1 }}>
          <View style={styles.filterRow}>
            {HISTORY_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterTab, historyFilter === f.value && styles.filterTabActive]}
                onPress={() => { setHistoryFilter(f.value); if (f.value !== 'custom') setLoading(true); }}
              >
                <Text style={[styles.filterText, historyFilter === f.value && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom date range calendar picker */}
          {historyFilter === 'custom' && (
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChangeDateFrom={setDateFrom}
              onChangeDateTo={setDateTo}
              onSearch={handleCustomSearch}
              accentColor={COLORS.success}
            />
          )}

          {payments.length > 0 && (
            <View style={styles.historyBar}>
              <Text style={styles.historyBarText}>
                {payments.length} payments • {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}
              </Text>
            </View>
          )}

          <FlatList
            data={payments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
            }
            ListEmptyComponent={
              <EmptyState icon="💳" title="No Payment History Found" subtitle="No payments match your filter" />
            }
            renderItem={({ item }) => {
              const shopObj = typeof item.shopId === 'object' ? (item.shopId as unknown as Shop) : null;
              return (
                <View style={styles.historyCard}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.historyShopName}>🏪 {shopObj?.name || '—'}</Text>
                      <Text style={styles.historyMethod}>{item.paymentMethod}</Text>
                      {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}
                      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  modeTabBar: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm, paddingTop: SPACING.sm, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modeTab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md, marginHorizontal: 4,
    backgroundColor: COLORS.surface,
  },
  modeTabActive: { backgroundColor: COLORS.success },
  modeTabText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  modeTabTextActive: { color: COLORS.white, fontFamily: FONTS.bold },

  topBar: {
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },

  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  todaySummaryCard: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  summaryTitle: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: SPACING.sm, opacity: 0.9 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 4 },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryStatValue: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.white },
  summaryStatLabel: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },

  shopGroupContainer: {
    marginBottom: SPACING.lg,
  },
  shopGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    borderBottomWidth: 2, borderBottomColor: COLORS.successLight,
  },
  shopHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopHeaderIcon: { fontSize: 18, marginRight: 8 },
  shopHeaderName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  shopHeaderBadge: {
    backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)',
  },
  shopHeaderBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.success },

  paymentCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderTopWidth: 0,
    borderLeftWidth: 4, borderLeftColor: COLORS.success,
    ...SHADOWS.xs,
  },
  historyCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 4, borderLeftColor: COLORS.success,
    ...SHADOWS.xs, borderWidth: 1, borderColor: COLORS.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, paddingRight: SPACING.md },
  historyShopName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 2 },
  methodTag: {
    alignSelf: 'flex-start', backgroundColor: COLORS.surface,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    marginBottom: 4, borderWidth: 1, borderColor: COLORS.border,
  },
  methodTagText: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  historyMethod: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  notes: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  date: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 4 },
  amount: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.success },

  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  filterText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  historyBar: {
    backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  historyBarText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.success },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
});

export default AllPaymentsScreen;
