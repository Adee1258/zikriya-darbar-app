import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList, Order } from '../../types';
import { ordersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const MyOrdersScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.shopId) return;
    try {
      const res = await ordersAPI.getByShop(user.shopId);
      setOrders(res.data.data || []);
    } catch { }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<EmptyState icon="📦" title="No orders yet" subtitle="Orders placed for your shop will appear here" />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        >
          <View style={styles.row}>
            <View>
              <Text style={styles.orderNum}>{item.orderNumber}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.items}>{item.items.length} items</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  items: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statusBadge: {
    backgroundColor: COLORS.successLight, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10, marginTop: 4,
  },
  statusText: { fontSize: 11, color: COLORS.success, fontWeight: '600', textTransform: 'capitalize' },
});

export default MyOrdersScreen;
