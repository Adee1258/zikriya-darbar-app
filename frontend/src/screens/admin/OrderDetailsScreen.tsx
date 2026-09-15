import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList, Order, Shop } from '../../types';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Card from '../../components/Card';

type Route = RouteProp<AdminStackParamList, 'OrderDetails'>;

const OrderDetailsScreen = () => {
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
    <View style={styles.center}>
      <Text style={styles.errorText}>Order not found</Text>
    </View>
  );

  const shop = typeof order.shopId === 'object' ? order.shopId as unknown as Shop : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: order.status === 'confirmed' ? COLORS.successLight : COLORS.dangerLight }]}>
            <Text style={[styles.statusText, { color: order.status === 'confirmed' ? COLORS.success : COLORS.danger }]}>
              {order.status}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Shop</Text>
          <Text style={styles.metaValue}>{shop?.name || '—'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{formatDateTime(order.createdAt)}</Text>
        </View>
      </Card>

      {/* Items */}
      <Text style={styles.sectionTitle}>Order Items</Text>
      {order.items.map((item, idx) => (
        <Card key={idx} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemQty}>
              {item.quantity} {item.unit} × {formatCurrency(item.rate)}
            </Text>
            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
          </View>
        </Card>
      ))}

      {/* Divider + Total */}
      <View style={styles.totalBox}>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Order Total</Text>
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
  errorText: { color: COLORS.danger, fontSize: 16 },
  headerCard: { padding: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  orderNum: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaLabel: { fontSize: 13, color: COLORS.textSecondary },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  itemCard: { padding: SPACING.md },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  itemDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemQty: { fontSize: 13, color: COLORS.textSecondary },
  itemTotal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalBox: { marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  totalAmount: { fontSize: 20, fontWeight: '800', color: COLORS.text },
});

export default OrderDetailsScreen;
