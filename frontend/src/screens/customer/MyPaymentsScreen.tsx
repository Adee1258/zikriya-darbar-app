import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Payment } from '../../types';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

const MyPaymentsScreen = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.shopId) return;
    try {
      const res = await paymentsAPI.getByShop(user.shopId);
      setPayments(res.data.data || []);
    } catch { }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {payments.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Payments Made</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
        </View>
      )}
      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="💳" title="No payments yet" subtitle="Your payment history will appear here" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>💳</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>Payment Received</Text>
              <Text style={styles.method}>{item.paymentMethod}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  summaryBox: {
    backgroundColor: COLORS.success, padding: SPACING.md, alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: '500' },
  summaryAmount: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.successLight, alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.sm,
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  method: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  notes: { fontSize: 12, color: COLORS.textMuted, marginTop: 1, fontStyle: 'italic' },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.success },
});

export default MyPaymentsScreen;
