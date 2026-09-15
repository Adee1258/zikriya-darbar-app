import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { ShopBalance, VisitDay } from '../../types';
import { shopsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type ViewMode = 'flat' | 'grouped';

interface MarketGroup {
  marketId: string | null;
  marketName: string;
  visitDay: VisitDay | string;
  shops: ShopBalance[];
  groupOutstanding: number;
}

const AllBalancesScreen = () => {
  const [shops, setShops] = useState<ShopBalance[]>([]);
  const [filtered, setFiltered] = useState<ShopBalance[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  const load = useCallback(async () => {
    try {
      const res = await shopsAPI.getAllBalances();
      const data = res.data.data;
      setShops(data.shops || []);
      setFiltered(data.shops || []);
      setTotalOutstanding(data.totalOutstanding || 0);
    } catch {
      console.error('Failed to load balances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) return setFiltered(shops);
    setFiltered(
      shops.filter(
        (s) =>
          s.shopName.toLowerCase().includes(text.toLowerCase()) ||
          s.ownerName.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  // Group shops by market
  const marketGroups = useMemo<MarketGroup[]>(() => {
    const map = new Map<string, MarketGroup>();

    filtered.forEach((shop) => {
      const mObj = shop.marketId && typeof shop.marketId === 'object'
        ? (shop.marketId as { _id: string; name: string; visitDay: VisitDay })
        : null;

      const key = mObj?._id ?? 'unassigned';
      const marketName = mObj?.name ?? 'Unassigned';
      const visitDay = mObj?.visitDay ?? 'None';

      if (!map.has(key)) {
        map.set(key, {
          marketId: mObj?._id ?? null,
          marketName,
          visitDay,
          shops: [],
          groupOutstanding: 0,
        });
      }
      const group = map.get(key)!;
      group.shops.push(shop);
      group.groupOutstanding += shop.currentBalance;
    });

    // Sort: named markets first (by visitDay order), unassigned last
    const dayOrder: Record<string, number> = {
      Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
      Friday: 4, Saturday: 5, Sunday: 6, None: 7,
    };
    return Array.from(map.values()).sort((a, b) => {
      if (a.marketId === null) return 1;
      if (b.marketId === null) return -1;
      return (dayOrder[a.visitDay] ?? 99) - (dayOrder[b.visitDay] ?? 99);
    });
  }, [filtered]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Total Outstanding Header */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Outstanding Balance</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalOutstanding)}</Text>
        <Text style={styles.totalCount}>{shops.length} shops</Text>
      </View>

      {/* Search + View Mode */}
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop or owner..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'grouped' && styles.modeBtnActive]}
            onPress={() => setViewMode('grouped')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'grouped' && styles.modeBtnTextActive]}>
              🏬 Markets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'flat' && styles.modeBtnActive]}
            onPress={() => setViewMode('flat')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'flat' && styles.modeBtnTextActive]}>
              📋 All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GROUPED VIEW */}
      {viewMode === 'grouped' ? (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {marketGroups.length === 0 ? (
            <EmptyState icon="⚖️" title="No shops found" />
          ) : (
            marketGroups.map((group) => (
              <View key={group.marketId ?? 'unassigned'} style={styles.groupContainer}>
                {/* Group Header */}
                <View style={styles.groupHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>
                      {group.marketId ? '🏬' : '📂'} {group.marketName}
                    </Text>
                    {group.visitDay !== 'None' && (
                      <Text style={styles.groupDay}>📅 {group.visitDay}</Text>
                    )}
                  </View>
                  <View style={styles.groupTotalBox}>
                    <Text style={styles.groupTotalLabel}>Outstanding</Text>
                    <Text style={[
                      styles.groupTotal,
                      { color: group.groupOutstanding > 0 ? COLORS.danger : COLORS.success },
                    ]}>
                      {formatCurrency(group.groupOutstanding)}
                    </Text>
                    <Text style={styles.groupCount}>{group.shops.length} shops</Text>
                  </View>
                </View>

                {/* Shops in this group */}
                {group.shops.map((item) => (
                  <ShopBalanceRow key={item.shopId} item={item} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* FLAT VIEW */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.shopId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState icon="⚖️" title="No shops found" />}
          renderItem={({ item }) => <ShopBalanceRow item={item} showMarket />}
        />
      )}
    </View>
  );
};

const ShopBalanceRow = ({
  item,
  showMarket = false,
}: {
  item: ShopBalance;
  showMarket?: boolean;
}) => {
  const marketName =
    item.marketId && typeof item.marketId === 'object'
      ? (item.marketId as { name: string }).name
      : null;

  return (
    <View style={styles.balanceCard}>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        {showMarket && marketName && (
          <Text style={styles.shopMarket}>🏬 {marketName}</Text>
        )}
        <Text style={styles.ownerName}>👤 {item.ownerName}</Text>
        <Text style={styles.phone}>📞 {item.phone}</Text>
      </View>
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text
          style={[
            styles.balance,
            { color: item.currentBalance > 0 ? COLORS.danger : COLORS.success },
          ]}
        >
          {formatCurrency(item.currentBalance)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  totalBox: { backgroundColor: COLORS.primary, padding: SPACING.lg, alignItems: 'center' },
  totalLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  totalAmount: { fontSize: 28, fontFamily: FONTS.heavy, color: COLORS.white, marginTop: 4 },
  totalCount: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  toolbar: {
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 9,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  modeToggle: { flexDirection: 'row', gap: SPACING.sm },
  modeBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.white },

  list: { padding: SPACING.md, paddingBottom: SPACING.xl },

  // Grouped
  groupContainer: { marginBottom: SPACING.lg },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryDeep,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  groupName: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.white },
  groupDay: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  groupTotalBox: { alignItems: 'flex-end' },
  groupTotalLabel: { fontSize: 10, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)' },
  groupTotal: { fontSize: 16, fontFamily: FONTS.heavy },
  groupCount: { fontSize: 10, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  // Shop row
  balanceCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.xs,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  shopMarket: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.primary, marginTop: 1 },
  ownerName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  balanceInfo: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.semiBold, textTransform: 'uppercase' },
  balance: { fontSize: 15, fontFamily: FONTS.heavy, marginTop: 2 },
});

export default AllBalancesScreen;
