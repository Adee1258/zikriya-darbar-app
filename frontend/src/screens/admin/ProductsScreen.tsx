import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Product } from '../../types';
import { productsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ProductsScreen = () => {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <EmptyState icon="🛒" title="No products yet" subtitle="Add products to start taking orders" />
        }
        ListFooterComponent={
          <Button title="+ Add Product" onPress={() => navigation.navigate('AddProduct')} style={styles.addBtn} />
        }
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.unit}>Unit: {item.unit}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'active' ? COLORS.successLight : COLORS.dangerLight }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'active' ? COLORS.success : COLORS.danger }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rate}>{formatCurrency(item.defaultRate)}</Text>
                <Text style={styles.rateLabel}>per {item.unit}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  productCard: { padding: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  unit: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  rateBox: { alignItems: 'flex-end' },
  rate: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  rateLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  editBtn: {
    marginTop: 8, paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  editText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  addBtn: { marginTop: SPACING.md },
});

export default ProductsScreen;
