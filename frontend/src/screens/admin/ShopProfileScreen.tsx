import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Shop } from '../../types';
import { shopsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen';
import Card from '../../components/Card';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
type Route = RouteProp<AdminStackParamList, 'ShopProfile'>;

const ActionButton = ({ icon, label, onPress, color = COLORS.primary }: {
  icon: string; label: string; onPress: () => void; color?: string;
}) => (
  <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const ShopProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { shopId } = route.params;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShop = useCallback(async () => {
    try {
      const res = await shopsAPI.getById(shopId);
      setShop(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load shop profile');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  // Reload every time screen comes into focus (e.g. after creating order/payment)
  useFocusEffect(useCallback(() => { loadShop(); }, [loadShop]));

  if (loading) return <LoadingScreen />;
  if (!shop) return null;

  const summary = shop.summary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadShop(); }} />}
    >
      {/* Shop Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.shopName}>{shop.name}</Text>
        <Text style={styles.infoRow}>👤 {shop.ownerName}</Text>
        <Text style={styles.infoRow}>📞 {shop.phone}</Text>
        <Text style={styles.infoRow}>📍 {shop.address}</Text>
      </Card>

      {/* Current Balance */}
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(shop.currentBalance ?? 0)}</Text>
      </View>

      {/* Summary Stats */}
      {summary && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
            <Text style={styles.summaryLabel}>Total Orders</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalPurchased)}</Text>
            <Text style={styles.summaryLabel}>Total Purchased</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {formatCurrency(summary.totalPaid)}
            </Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
        </View>
      )}

      {/* Primary Actions */}
      <View style={styles.primaryActions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('NewOrder', { shopId: shop._id, shopName: shop.name })}
        >
          <Text style={styles.primaryBtnText}>📦  New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: COLORS.success }]}
          onPress={() =>
            navigation.navigate('AddPayment', {
              shopId: shop._id,
              shopName: shop.name,
              currentBalance: shop.currentBalance ?? 0,
            })
          }
        >
          <Text style={styles.primaryBtnText}>💳  Add Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.actionsGrid}>
        <ActionButton icon="📋" label="Orders" onPress={() => navigation.navigate('AllOrders')} />
        <ActionButton icon="💰" label="Payments" onPress={() => navigation.navigate('AllPayments')} />
        <ActionButton icon="📊" label="Ledger"
          onPress={() => navigation.navigate('ShopLedger', { shopId: shop._id, shopName: shop.name })} />
        <ActionButton icon="✏️" label="Edit Shop"
          onPress={() => navigation.navigate('EditShop', { shopId: shop._id })} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  infoCard: { padding: SPACING.md, marginBottom: SPACING.md },
  shopName: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  infoRow: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  balanceBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  balanceLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 30, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: COLORS.border },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  primaryActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
});

export default ShopProfileScreen;
