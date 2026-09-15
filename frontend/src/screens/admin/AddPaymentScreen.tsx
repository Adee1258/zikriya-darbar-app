import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../types';
import { paymentsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';

type Route = RouteProp<AdminStackParamList, 'AddPayment'>;
const METHODS = ['Cash', 'Bank Transfer', 'Other'];

const AddPaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { shopId, shopName, currentBalance } = route.params;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const newBalance = currentBalance - (Number(amount) || 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount) e.amount = 'Amount is required';
    else if (isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid positive amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    Alert.alert(
      'Confirm Payment',
      `Shop: ${shopName}\nAmount: ${formatCurrency(Number(amount))}\nMethod: ${method}\nNew Balance: ${formatCurrency(newBalance)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Payment',
          onPress: async () => {
            setLoading(true);
            try {
              await paymentsAPI.create({
                shopId,
                amount: Number(amount),
                paymentMethod: method,
                notes: notes.trim(),
              });
              Alert.alert('Payment Saved', `Payment of ${formatCurrency(Number(amount))} recorded.\nNew Balance: ${formatCurrency(newBalance)}`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to save payment';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Shop + Balance */}
        <View style={styles.balanceBox}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balance}>{formatCurrency(currentBalance)}</Text>
        </View>

        <Input
          label="Payment Amount (Rs.) *"
          placeholder="e.g. 20000"
          value={amount}
          onChangeText={setAmount}
          error={errors.amount}
          keyboardType="numeric"
        />

        {/* Preview new balance */}
        {amount && !errors.amount && (
          <View style={styles.previewRow}>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Previous Balance</Text>
              <Text style={styles.previewVal}>{formatCurrency(currentBalance)}</Text>
            </View>
            <Text style={styles.arrow}>{"→"}</Text>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>New Balance</Text>
              <Text style={[styles.previewVal, { color: newBalance < 0 ? COLORS.danger : COLORS.success }]}>
                {formatCurrency(newBalance)}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>Payment Method *</Text>
        <View style={styles.methodRow}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
            >
              <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Notes (optional)"
          placeholder="e.g. Cash received from owner"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button title="Save Payment" onPress={handleSave} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  balanceBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.lg,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  shopName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  balanceLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase' },
  balance: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  previewItem: { alignItems: 'center' },
  previewLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  previewVal: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  arrow: { fontSize: 18, color: COLORS.textMuted },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  methodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  methodText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  methodTextActive: { color: COLORS.primary, fontWeight: '700' },
  btn: { marginTop: SPACING.sm },
});

export default AddPaymentScreen;
