import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList, LedgerTransaction } from '../../types';
import { ledgerAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import EmptyState from '../../components/EmptyState';

type Route = RouteProp<AdminStackParamList, 'ShopLedger'>;

const typeIcon = (type: string) => {
  if (type === 'ORDER') return '📦';
  if (type === 'PAYMENT') return '💳';
  return '🏁';
};

const ShopLedgerScreen = () => {
  const route = useRoute<Route>();
  const { shopId, shopName } = route.params;
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ledgerAPI.getByShop(shopId).then((res) => {
      setTransactions(res.data.data.transactions || []);
      setCurrentBalance(res.data.data.currentBalance || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopId]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Balance Header */}
      <View style={styles.balanceBox}>
        <Text style={styles.shopName}>{shopName}</Text>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colDate]}>Date</Text>
        <Text style={[styles.col, styles.colDesc]}>Description</Text>
        <Text style={[styles.col, styles.colAmt, { color: COLORS.danger }]}>Debit</Text>
        <Text style={[styles.col, styles.colAmt, { color: COLORS.success }]}>Credit</Text>
        <Text style={[styles.col, styles.colBalance]}>Balance</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📊" title="No transactions yet" />}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderLeftColor: item.credit > 0 ? COLORS.success : COLORS.danger }]}>
            <Text style={[styles.col, styles.colDate, styles.rowText]}>
              {formatDate(item.createdAt)}
            </Text>
            <View style={[styles.col, styles.colDesc]}>
              <Text style={styles.descText}>{typeIcon(item.type)} {item.description}</Text>
            </View>
            <Text style={[styles.col, styles.colAmt, { color: item.debit > 0 ? COLORS.danger : COLORS.textMuted }]}>
              {item.debit > 0 ? formatCurrency(item.debit) : '—'}
            </Text>
            <Text style={[styles.col, styles.colAmt, { color: item.credit > 0 ? COLORS.success : COLORS.textMuted }]}>
              {item.credit > 0 ? formatCurrency(item.credit) : '—'}
            </Text>
            <Text style={[styles.col, styles.colBalance, styles.balanceText]}>
              {formatCurrency(item.balanceAfter)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceBox: {
    backgroundColor: COLORS.primary, padding: SPACING.md, alignItems: 'center',
  },
  shopName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 4 },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  list: { paddingBottom: SPACING.xl },
  row: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.background,
    borderLeftWidth: 3, borderLeftColor: COLORS.border,
  },
  col: { justifyContent: 'center' },
  colDate: { width: 72 },
  colDesc: { flex: 1, paddingRight: 4 },
  colAmt: { width: 70, textAlign: 'right', fontSize: 11 },
  colBalance: { width: 72, textAlign: 'right' },
  rowText: { fontSize: 11, color: COLORS.textSecondary },
  descText: { fontSize: 11, color: COLORS.text, fontWeight: '500' },
  balanceText: { fontSize: 11, fontWeight: '700', color: COLORS.text, textAlign: 'right' },
});

export default ShopLedgerScreen;
