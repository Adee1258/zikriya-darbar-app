import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { productsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';

const UNITS = ['KG', 'Packet', 'Bag', 'Box', 'Piece'];

const AddProductScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: '', unit: 'KG', defaultRate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.defaultRate) e.defaultRate = 'Rate is required';
    if (isNaN(Number(form.defaultRate)) || Number(form.defaultRate) <= 0)
      e.defaultRate = 'Rate must be a positive number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await productsAPI.create({
        name: form.name.trim(),
        unit: form.unit,
        defaultRate: Number(form.defaultRate),
      });
      Alert.alert('Success', 'Product added', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create product';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Product Name *" placeholder="e.g. Mishri" value={form.name}
          onChangeText={(v) => set('name', v)} error={errors.name} />

        <Text style={styles.label}>Unit *</Text>
        <View style={styles.unitGrid}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, form.unit === u && styles.unitBtnActive]}
              onPress={() => set('unit', u)}
            >
              <Text style={[styles.unitText, form.unit === u && styles.unitTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Default Rate (Rs.) *" placeholder="e.g. 400" value={form.defaultRate}
          onChangeText={(v) => set('defaultRate', v)} error={errors.defaultRate}
          keyboardType="numeric" />

        <Button title="Add Product" onPress={handleSubmit} loading={loading} style={styles.btn} />
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
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  unitBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  unitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  unitTextActive: { color: COLORS.primary, fontWeight: '700' },
  btn: { marginTop: SPACING.md },
});

export default AddProductScreen;
