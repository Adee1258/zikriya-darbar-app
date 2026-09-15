import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { CustomerStackParamList, Order } from '../../types';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Card from '../../components/Card';

type Route = RouteProp<CustomerStackParamList, 'OrderDetails'>;

const CustomerOrderDetailsScreen = () => {
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getById(orderId).then((res) => {
      setOrder(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
  if (!order) return (
    <View style={styles.center}><Text>Order not found</Text></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.orderNum}>{order.orderNumber}</Text>
        <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Items</Text>
      {order.items.map((item, idx) => (
        <Card key={idx} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity} {item.unit} × {formatCurrency(item.rate)}</Text>
            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
          </View>
        </Card>
      ))}

      <View style={styles.totalBox}>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { padding: SPACING.md, marginBottom: SPACING.md },
  orderNum: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  itemCard: { padding: SPACING.md },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemQty: { fontSize: 13, color: COLORS.textSecondary },
  itemTotal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalBox: { marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  totalAmount: { fontSize: 20, fontWeight: '800', color: COLORS.text },
});

export default CustomerOrderDetailsScreen;
