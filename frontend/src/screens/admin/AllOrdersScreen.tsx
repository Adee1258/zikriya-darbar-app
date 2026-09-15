import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, ScrollView, Alert, Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Order } from '../../types';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import DateRangePicker from '../../components/DateRangePicker';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
type ViewMode = 'today' | 'history';
type HistoryFilter = '' | 'week' | 'month' | 'custom';

const QUICK_FILTERS = [
  { label: 'All History', value: '' as HistoryFilter },
  { label: 'This Week', value: 'week' as HistoryFilter },
  { label: 'This Month', value: 'month' as HistoryFilter },
  { label: '📅 Custom', value: 'custom' as HistoryFilter },
];

interface ShopGroup {
  shopId: string;
  shopName: string;
  totalAmount: number;
  orders: Order[];
}

const AllOrdersScreen = () => {
  const navigation = useNavigation<Nav>();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sharing, setSharing] = useState(false);

  const loadData = useCallback(async (
    mode: ViewMode = viewMode,
    hFilter: HistoryFilter = historyFilter,
    q: string = search,
    from: string = dateFrom,
    to: string = dateTo,
  ) => {
    try {
      const params: Parameters<typeof ordersAPI.getAll>[0] = {
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

      const res = await ordersAPI.getAll(params);
      setOrders(res.data.data || []);
    } catch {
      console.error('Failed to load orders');
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

  // Group today's orders by Shop
  const shopGroups = useMemo<ShopGroup[]>(() => {
    if (viewMode !== 'today') return [];
    const map = new Map<string, ShopGroup>();
    orders.forEach((order) => {
      const shopName =
        typeof order.shopId === 'object'
          ? (order.shopId as { name: string }).name
          : order.shop?.name || 'Unknown Shop';
      const shopIdKey =
        typeof order.shopId === 'object'
          ? (order.shopId as { _id: string })._id
          : String(order.shopId);
      if (!map.has(shopIdKey)) {
        map.set(shopIdKey, { shopId: shopIdKey, shopName, totalAmount: 0, orders: [] });
      }
      const group = map.get(shopIdKey)!;
      group.orders.push(order);
      group.totalAmount += order.total;
    });
    return Array.from(map.values());
  }, [orders, viewMode]);

  const todaySummary = useMemo(() => ({
    totalOrdersCount: orders.length,
    totalSalesSum: orders.reduce((acc, o) => acc + o.total, 0),
    totalShopsCount: shopGroups.length,
  }), [orders, shopGroups]);

  // ── Share / Download ──────────────────────────────────────────────────────
  const handleShare = async () => {
    if (orders.length === 0) { Alert.alert('No Orders', 'Share ke liye koi order nahi hai'); return; }
    setSharing(true);
    try {
      const periodLabel =
        viewMode === 'today' ? 'Aaj'
          : historyFilter === 'week' ? 'Is Hafte'
            : historyFilter === 'month' ? 'Is Mahine'
              : historyFilter === 'custom' ? `${dateFrom} to ${dateTo}`
                : 'All Time';

      let text = `📦 Zikriya Darbar — Orders Report\n`;
      text += `📅 Period: ${periodLabel}\n`;
      text += `${'─'.repeat(40)}\n\n`;

      if (viewMode === 'today') {
        shopGroups.forEach((group, gi) => {
          text += `${gi + 1}. 🏪 ${group.shopName}\n`;
          group.orders.forEach((order) => {
            text += `   Order#: ${order.orderNumber}\n`;
            if (order.items?.length) {
              order.items.forEach((it) => {
                text += `     • ${it.productName}: ${it.quantity} ${it.unit} @ ${formatCurrency(it.rate)} = ${formatCurrency(it.total)}\n`;
              });
            }
            text += `   Total: ${formatCurrency(order.total)}\n`;
            text += `   Time:  ${formatDateTime(order.createdAt)}\n\n`;
          });
          text += `   Shop Total: ${formatCurrency(group.totalAmount)}\n`;
          text += `${'─'.repeat(30)}\n`;
        });
      } else {
        orders.forEach((order, i) => {
          const shopName =
            typeof order.shopId === 'object'
              ? (order.shopId as { name: string }).name
              : order.shop?.name || '—';
          text += `${i + 1}. ${order.orderNumber} — ${shopName}\n`;
          if (order.items?.length) {
            order.items.forEach((it) => {
              text += `   • ${it.productName}: ${it.quantity} ${it.unit} @ ${formatCurrency(it.rate)} = ${formatCurrency(it.total)}\n`;
            });
          }
          text += `   Total: ${formatCurrency(order.total)}\n`;
          text += `   Date:  ${formatDate(order.createdAt)}\n\n`;
        });
      }

      text += `${'─'.repeat(40)}\n`;
      text += `TOTAL ORDERS: ${orders.length}\n`;
      text += `TOTAL AMOUNT: ${formatCurrency(orders.reduce((s, o) => s + o.total, 0))}\n`;

      await Share.share({ message: text, title: 'Orders Report' });
    } catch {
      Alert.alert('Error', 'Share nahi ho saka');
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading orders..." />;

  const renderItemDetails = (items?: Order['items']) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.itemsListContainer}>
        <Text style={styles.itemsHeaderTitle}>📦 Ordered Items ({items.length}):</Text>
        {items.map((it, idx) => (
          <View key={idx} style={styles.itemDetailRow}>
            <Text style={styles.itemNameText} numberOfLines={1}>• {it.productName}</Text>
            <View style={styles.itemRightGroup}>
              <Text style={styles.itemQtyText}>{it.quantity} {it.unit}</Text>
              <Text style={styles.itemRateText}>@{formatCurrency(it.rate)}</Text>
              <Text style={styles.itemTotalText}>{formatCurrency(it.total)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mode Tabs */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'today' && styles.modeTabActive]}
          onPress={() => { setViewMode('today'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'today' && styles.modeTabTextActive]}>
            ☀️ Today's Market Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'history' && styles.modeTabActive]}
          onPress={() => { setViewMode('history'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'history' && styles.modeTabTextActive]}>
            📜 Order History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search + Share */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search shop name or order #..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          disabled={sharing || orders.length === 0}
        >
          <Text style={styles.shareBtnText}>{sharing ? '⏳' : '📤'}</Text>
        </TouchableOpacity>
      </View>

      {/* TODAY VIEW */}
      {viewMode === 'today' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.todaySummaryCard}>
            <Text style={styles.summaryTitle}>📅 Today's Collection Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalShopsCount}</Text>
                <Text style={styles.summaryStatLabel}>Shops Visited</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalOrdersCount}</Text>
                <Text style={styles.summaryStatLabel}>Total Orders</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, { color: COLORS.accent }]}>
                  {formatCurrency(todaySummary.totalSalesSum)}
                </Text>
                <Text style={styles.summaryStatLabel}>Total Value</Text>
              </View>
            </View>
          </View>

          {shopGroups.length === 0 ? (
            <EmptyState icon="🛍️" title="No Orders Today Yet" subtitle="Orders created today will appear here grouped shop-by-shop" />
          ) : (
            shopGroups.map((group) => (
              <View key={group.shopId} style={styles.shopGroupContainer}>
                <View style={styles.shopGroupHeader}>
                  <View style={styles.shopHeaderTitleRow}>
                    <Text style={styles.shopHeaderIcon}>🏪</Text>
                    <Text style={styles.shopHeaderName}>{group.shopName}</Text>
                  </View>
                  <View style={styles.shopHeaderBadge}>
                    <Text style={styles.shopHeaderBadgeText}>
                      {group.orders.length} order{group.orders.length > 1 ? 's' : ''} • {formatCurrency(group.totalAmount)}
                    </Text>
                  </View>
                </View>
                {group.orders.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.orderNum}>{item.orderNumber}</Text>
                      <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
                    </View>
                    {renderItemDetails(item.items)}
                    <View style={styles.cardBottom}>
                      <Text style={styles.date}>🕒 {formatDateTime(item.createdAt)}</Text>
                      <Text style={styles.tapHint}>Tap for details →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* HISTORY VIEW */
        <View style={{ flex: 1 }}>
          {/* Quick filter tabs */}
          <View style={styles.filterRow}>
            {QUICK_FILTERS.map((f) => (
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
              accentColor={COLORS.primary}
            />
          )}

          {/* Summary bar for history */}
          {orders.length > 0 && (
            <View style={styles.historyBar}>
              <Text style={styles.historyBarText}>
                {orders.length} orders • {formatCurrency(orders.reduce((s, o) => s + o.total, 0))}
              </Text>
            </View>
          )}

          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
            }
            ListEmptyComponent={
              <EmptyState icon="📋" title="No History Found" subtitle="No orders match your filter" />
            }
            renderItem={({ item }) => {
              const shopName =
                typeof item.shopId === 'object'
                  ? (item.shopId as { name: string }).name
                  : item.shop?.name || '—';
              return (
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.orderNum}>{item.orderNumber}</Text>
                    <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
                  </View>
                  <Text style={styles.shopName}>🏪 {shopName}</Text>
                  {renderItemDetails(item.items)}
                  <View style={styles.cardBottom}>
                    <Text style={styles.date}>🕒 {formatDate(item.createdAt)}</Text>
                    <Text style={styles.tapHint}>Tap for details →</Text>
                  </View>
                </TouchableOpacity>
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
    borderRadius: BORDER_RADIUS.md, marginHorizontal: 4, backgroundColor: COLORS.surface,
  },
  modeTabActive: { backgroundColor: COLORS.primary },
  modeTabText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  modeTabTextActive: { color: COLORS.white, fontFamily: FONTS.bold },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  searchInput: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  shareBtn: {
    backgroundColor: COLORS.primary, width: 42, height: 42,
    borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontSize: 18 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  todaySummaryCard: {
    backgroundColor: COLORS.primaryDeep, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOWS.md,
  },
  summaryTitle: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: SPACING.sm, opacity: 0.9 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 4 },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryStatValue: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.white },
  summaryStatLabel: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  shopGroupContainer: { marginBottom: SPACING.lg },
  shopGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 2, borderBottomColor: COLORS.primaryLight,
  },
  shopHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopHeaderIcon: { fontSize: 18, marginRight: 8 },
  shopHeaderName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  shopHeaderBadge: {
    backgroundColor: COLORS.accentLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  shopHeaderBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.accentDark },
  orderCard: {
    backgroundColor: COLORS.white, padding: SPACING.md, marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderNum: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.primary },
  amount: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.text },
  shopName: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6 },
  itemsListContainer: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginVertical: 6, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  itemsHeaderTitle: {
    fontSize: 11, fontFamily: FONTS.heavy, color: COLORS.textSecondary,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  itemDetailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  itemNameText: { flex: 1, fontSize: 12, fontFamily: FONTS.bold, color: COLORS.text, paddingRight: 4 },
  itemRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemQtyText: { fontSize: 12, fontFamily: FONTS.heavy, color: COLORS.primary },
  itemRateText: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textMuted },
  itemTotalText: { fontSize: 12, fontFamily: FONTS.heavy, color: COLORS.text, minWidth: 60, textAlign: 'right' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  date: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textMuted },
  tapHint: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.primary },

  // History filters
  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },

  historyBar: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  historyBarText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.primary },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
});

export default AllOrdersScreen;
