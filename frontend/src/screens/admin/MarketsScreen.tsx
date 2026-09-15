import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminStackParamList, AllMarketsReport, AllMarketsReportEntry } from '../../types';
import { marketsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const DAY_COLORS: Record<string, string> = {
  Monday:    '#6366F1',
  Tuesday:   '#F59E0B',
  Wednesday: '#10B981',
  Thursday:  '#3B82F6',
  Friday:    '#EF4444',
  Saturday:  '#8B5CF6',
  Sunday:    '#EC4899',
  None:      '#94A3B8',
};

const MarketsScreen = () => {
  const navigation = useNavigation<Nav>();
  const [report, setReport] = useState<AllMarketsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(7);

  const loadData = useCallback(async (d: number = days) => {
    try {
      const res = await marketsAPI.getAllReport(d);
      setReport(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load markets report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDaysChange = (d: number) => {
    setDays(d);
    setLoading(true);
    loadData(d);
  };

  if (loading) return <LoadingScreen message="Loading markets..." />;

  const markets = report?.markets ?? [];
  const totals = report?.grandTotals;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />
      }
    >
      {/* Grand Total Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <Text style={styles.headerTitle}>🏬 All Markets Overview</Text>
        <View style={styles.headerGrid}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{totals?.totalShops ?? 0}</Text>
            <Text style={styles.headerStatLabel}>Total Shops</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{formatCurrency(totals?.totalSales ?? 0)}</Text>
            <Text style={styles.headerStatLabel}>Period Sales</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatValue, { color: COLORS.accent }]}>
              {formatCurrency(totals?.totalOutstanding ?? 0)}
            </Text>
            <Text style={styles.headerStatLabel}>Outstanding</Text>
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

      {/* Add Market Button */}
      <Button
        title="+ Add New Market"
        onPress={() => navigation.navigate('AddMarket')}
        style={styles.addBtn}
      />

      {/* Market Cards */}
      {markets.length === 0 ? (
        <EmptyState
          icon="🏬"
          title="No Markets Yet"
          subtitle="Add your first market to start grouping shops"
        />
      ) : (
        markets.map((market) => (
          <MarketCard
            key={market.marketId ?? 'unassigned'}
            market={market}
            onPress={() => {
              if (market.marketId) {
                navigation.navigate('MarketDetail', {
                  marketId: String(market.marketId),
                  marketName: market.marketName,
                });
              }
            }}
            onEdit={() => {
              if (market.marketId) {
                navigation.navigate('EditMarket', { marketId: String(market.marketId) });
              }
            }}
          />
        ))
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

const MarketCard = ({
  market,
  onPress,
  onEdit,
}: {
  market: AllMarketsReportEntry;
  onPress: () => void;
  onEdit: () => void;
}) => {
  const dayColor = DAY_COLORS[market.visitDay] ?? COLORS.textMuted;
  const isUnassigned = !market.marketId;

  return (
    <TouchableOpacity
      style={styles.marketCard}
      onPress={onPress}
      activeOpacity={isUnassigned ? 1 : 0.85}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: dayColor }]} />

      <View style={styles.marketBody}>
        {/* Top row */}
        <View style={styles.marketTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.marketName}>{market.marketName}</Text>
            <View style={styles.dayBadge}>
              <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
              <Text style={[styles.dayText, { color: dayColor }]}>{market.visitDay}</Text>
            </View>
          </View>
          <View style={styles.shopCountBadge}>
            <Text style={styles.shopCountText}>{market.shopCount} shops</Text>
          </View>
          {!isUnassigned && (
            <TouchableOpacity style={styles.editChip} onPress={onEdit}>
              <Text style={styles.editChipText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{market.periodOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(market.periodSales)}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {formatCurrency(market.periodReceived)}
            </Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>
              {formatCurrency(market.totalOutstanding)}
            </Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
        </View>

        {!isUnassigned && (
          <Text style={styles.tapHint}>Tap to view shops & report →</Text>
        )}
      </View>
    </TouchableOpacity>
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
  headerTitle: {
    fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.white,
    marginBottom: SPACING.md,
  },
  headerGrid: { flexDirection: 'row', alignItems: 'center' },
  headerStat: { flex: 1, alignItems: 'center' },
  headerDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  headerStatValue: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.white },
  headerStatLabel: {
    fontSize: 10, fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)', marginTop: 2,
  },

  // Period selector
  periodRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.sm, gap: SPACING.sm,
  },
  periodLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  periodBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  periodBtnTextActive: { color: COLORS.white },

  addBtn: { marginBottom: SPACING.md },

  // Market Card
  marketCard: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
    overflow: 'hidden', ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  accentBar: { width: 5 },
  marketBody: { flex: 1, padding: SPACING.md },
  marketTopRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  marketName: {
    fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.text, marginBottom: 4,
  },
  dayBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayText: { fontSize: 12, fontFamily: FONTS.bold },
  shopCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round, marginLeft: SPACING.sm,
  },
  shopCountText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary },
  editChip: {
    marginLeft: SPACING.sm, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border,
  },
  editChipText: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },

  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  statValue: { fontSize: 12, fontFamily: FONTS.heavy, color: COLORS.text },
  statLabel: { fontSize: 10, fontFamily: FONTS.medium, color: COLORS.textMuted, marginTop: 1 },

  tapHint: {
    fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.primary,
    textAlign: 'right', marginTop: 2,
  },
});

export default MarketsScreen;
