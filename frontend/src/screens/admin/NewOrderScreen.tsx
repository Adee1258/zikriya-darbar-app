import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Product } from '../../types';
import { productsAPI, ordersAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<AdminStackParamList>;
type Route = RouteProp<AdminStackParamList, 'NewOrder'>;

interface CartItem {
  product: Product;
  quantity: string;
  rate: string;
}

const NewOrderScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { shopId, shopName } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productsAPI.getAll('active').then((res) => {
      const data = res.data.data || [];
      setProducts(data);
      setFiltered(data);
      setLoading(false);
    }).catch(() => {
      Alert.alert('Error', 'Failed to load products');
      setLoading(false);
    });
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) return setFiltered(products);
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(text.toLowerCase())));
  };

  const updateCart = (product: Product, field: 'quantity' | 'rate', value: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product._id);
      if (existing) {
        next.set(product._id, { ...existing, [field]: value });
      } else {
        next.set(product._id, {
          product,
          quantity: field === 'quantity' ? value : '',
          rate: field === 'rate' ? value : String(product.defaultRate),
        });
      }
      return next;
    });
  };

  const addToCart = (product: Product) => {
    if (cart.has(product._id)) return;
    setCart((prev) => {
      const next = new Map(prev);
      next.set(product._id, { product, quantity: '1', rate: String(product.defaultRate) });
      return next;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  };

  const cartItems = Array.from(cart.values()).filter((i) => i.quantity && Number(i.quantity) > 0);

  const orderTotal = cartItems.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const r = Number(item.rate) || 0;
    return sum + q * r;
  }, 0);

  const handleSaveOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Order', 'Please add at least one product with a quantity.');
      return;
    }

    const invalidItem = cartItems.find((i) => Number(i.rate) <= 0);
    if (invalidItem) {
      Alert.alert('Invalid Rate', `Rate for ${invalidItem.product.name} must be greater than 0`);
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Shop: ${shopName}\nTotal: ${formatCurrency(orderTotal)}\nItems: ${cartItems.length}\n\nSave this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Order',
          onPress: async () => {
            setSaving(true);
            try {
              await ordersAPI.create({
                shopId,
                items: cartItems.map((i) => ({
                  productId: i.product._id,
                  quantity: Number(i.quantity),
                  rate: Number(i.rate),
                })),
              });
              Alert.alert('Order Saved', `Order created successfully.\nNew balance will be updated.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to create order';
              Alert.alert('Error', msg);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={styles.flex}>
        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search products..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
        </View>

        {/* Products List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          style={styles.productList}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const inCart = cart.has(item._id);
            const cartItem = cart.get(item._id);
            const qty = cartItem?.quantity || '';
            const rate = cartItem?.rate || String(item.defaultRate);
            const lineTotal = (Number(qty) || 0) * (Number(rate) || 0);

            return (
              <View style={[styles.productRow, inCart && styles.productRowActive]}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productUnit}>{item.unit}</Text>
                </View>

                {inCart ? (
                  <View style={styles.cartInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Rate (PKR)</Text>
                      <TextInput
                        style={styles.numInput}
                        value={rate}
                        onChangeText={(v) => updateCart(item, 'rate', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Quantity</Text>
                      <TextInput
                        style={[styles.numInput, styles.qtyInput]}
                        value={qty}
                        onChangeText={(v) => updateCart(item, 'quantity', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        autoFocus
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Total</Text>
                      <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeBtn}>
                      <Text style={styles.removeText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.addRow}>
                    <Text style={styles.defaultRate}>{formatCurrency(item.defaultRate)}/{item.unit}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} activeOpacity={0.8}>
                      <Text style={styles.addText}>+ Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Order Total Footer */}
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({cartItems.length} items)</Text>
            <Text style={styles.totalAmount}>{formatCurrency(orderTotal)}</Text>
          </View>
          <Button
            title="Save Order"
            onPress={handleSaveOrder}
            loading={saving}
            disabled={cartItems.length === 0}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  searchBox: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: COLORS.background, 
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, 
    paddingVertical: 12,
    fontSize: 15, 
    color: COLORS.text, 
    borderWidth: 1, 
    borderColor: COLORS.border,
  },
  productList: { flex: 1 },
  productRow: {
    backgroundColor: COLORS.white, 
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, 
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  productRowActive: { 
    borderWidth: 2, 
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  productInfo: { marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  productUnit: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  addRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  defaultRate: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
  addBtn: {
    backgroundColor: COLORS.primary, 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.sm,
  },
  addText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  cartInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginTop: 10 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  numInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8, 
    paddingVertical: 10, 
    fontSize: 15, 
    fontWeight: '700',
    color: COLORS.text, 
    textAlign: 'center', 
    minHeight: 44,
  },
  qtyInput: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  lineTotal: { fontSize: 15, fontWeight: '800', color: COLORS.primary, paddingVertical: 10, textAlign: 'center' },
  removeBtn: {
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.dangerLight, 
    alignSelf: 'flex-end',
  },
  removeText: { color: COLORS.danger, fontWeight: '700', fontSize: 18 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, 
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  totalLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: COLORS.text },
});

export default NewOrderScreen;
