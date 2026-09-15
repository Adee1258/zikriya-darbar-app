import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { LedgerTransaction } from '../../types';
import { ledgerAPI, shopsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

const AccountHistoryScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.shopId) return;
    try {
      const res = await ledgerAPI.getByShop(user.shopId);
      setTransactions(res.data.data.transactions || []);
      setCurrentBalance(res.data.data.currentBalance || 0);
    } catch { }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Current Balance */}
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colDate, styles.headerText]}>Date</Text>
        <Text style={[styles.col, styles.colDesc, styles.headerText]}>Description</Text>
        <Text style={[styles.col, styles.colAmt, styles.headerText, { color: COLORS.danger }]}>Debit</Text>
        <Text style={[styles.col, styles.colAmt, styles.headerText, { color: COLORS.success }]}>Credit</Text>
        <Text style={[styles.col, styles.colBal, styles.headerText]}>Balance</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="📊" title="No transactions yet" />}
        renderItem={({ item }) => (
          <View style={[
            styles.row,
            { borderLeftColor: item.credit > 0 ? COLORS.success : COLORS.danger }
          ]}>
            <Text style={[styles.col, styles.colDate, styles.rowText]}>
              {formatDate(item.createdAt)}
            </Text>
            <Text style={[styles.col, styles.colDesc, styles.descText]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.col, styles.colAmt, { color: item.debit > 0 ? COLORS.danger : COLORS.textMuted, fontSize: 11 }]}>
              {item.debit > 0 ? formatCurrency(item.debit) : '—'}
            </Text>
            <Text style={[styles.col, styles.colAmt, { color: item.credit > 0 ? COLORS.success : COLORS.textMuted, fontSize: 11 }]}>
              {item.credit > 0 ? formatCurrency(item.credit) : '—'}
            </Text>
            <Text style={[styles.col, styles.colBal, styles.balText]}>
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
  balanceBox: {
    backgroundColor: COLORS.primary, padding: SPACING.md, alignItems: 'center',
  },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: 8, paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1.5, borderBottomColor: COLORS.border,
  },
  headerText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  col: { justifyContent: 'center' },
  colDate: { width: 68 },
  colDesc: { flex: 1, paddingRight: 4 },
  colAmt: { width: 65, textAlign: 'right' },
  colBal: { width: 70, textAlign: 'right' },
  row: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.background,
    borderLeftWidth: 3,
  },
  rowText: { fontSize: 11, color: COLORS.textSecondary },
  descText: { fontSize: 11, color: COLORS.text, fontWeight: '500' },
  balText: { fontSize: 11, fontWeight: '700', color: COLORS.text, textAlign: 'right' },
});

export default AccountHistoryScreen;
