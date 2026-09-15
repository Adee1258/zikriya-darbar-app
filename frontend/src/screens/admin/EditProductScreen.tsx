import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../types';
import { productsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

type Route = RouteProp<AdminStackParamList, 'EditProduct'>;
const UNITS = ['KG', 'Packet', 'Bag', 'Box', 'Piece'];

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { productId } = route.params;

  const [form, setForm] = useState({ name: '', unit: 'KG', defaultRate: '', status: 'active' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    productsAPI.getById(productId).then((res) => {
      const p = res.data.data;
      setForm({ name: p.name, unit: p.unit, defaultRate: String(p.defaultRate), status: p.status });
      setLoading(false);
    }).catch(() => {
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    });
  }, [productId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.defaultRate || isNaN(Number(form.defaultRate)) || Number(form.defaultRate) <= 0)
      e.defaultRate = 'Valid rate required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await productsAPI.update(productId, {
        name: form.name.trim(),
        unit: form.unit,
        defaultRate: Number(form.defaultRate),
        status: form.status,
      });
      Alert.alert('Success', 'Product updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Product Name *" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />

        <Text style={styles.label}>Unit *</Text>
        <View style={styles.unitGrid}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u} style={[styles.unitBtn, form.unit === u && styles.unitActive]}
              onPress={() => set('unit', u)}
            >
              <Text style={[styles.unitText, form.unit === u && styles.unitTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Default Rate (Rs.) *" value={form.defaultRate}
          onChangeText={(v) => set('defaultRate', v)} error={errors.defaultRate} keyboardType="numeric" />

        <Text style={styles.label}>Status</Text>
        <View style={styles.unitGrid}>
          {['active', 'inactive'].map((s) => (
            <TouchableOpacity
              key={s} style={[styles.unitBtn, form.status === s && styles.unitActive]}
              onPress={() => set('status', s)}
            >
              <Text style={[styles.unitText, form.status === s && styles.unitTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Save Changes" onPress={handleSave} loading={saving} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  unitBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  unitActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  unitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  unitTextActive: { color: COLORS.primary, fontWeight: '700' },
  btn: { marginTop: SPACING.md },
});

export default EditProductScreen;
