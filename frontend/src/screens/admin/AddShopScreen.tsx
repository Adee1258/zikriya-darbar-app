import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Market } from '../../types';
import { shopsAPI, marketsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const AddShopScreen = () => {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState({
    name: '', ownerName: '', phone: '', address: '',
    username: '', password: '', openingBalance: '',
  });
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marketsAPI.getAll()
      .then((res) => setMarkets(res.data.data || []))
      .catch(() => {/* markets are optional, silently ignore */ });
  }, []);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (form.username.trim().length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.password) e.password = 'Password is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.openingBalance && isNaN(Number(form.openingBalance)))
      e.openingBalance = 'Must be a valid number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await shopsAPI.create({
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        username: form.username.trim(),
        password: form.password,
        openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
        marketId: selectedMarketId || undefined,
      });
      Alert.alert('Success', 'Shop created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create shop';
      setSubmitError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedMarket = markets.find((m) => m._id === selectedMarketId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Input label="Shop Name *" placeholder="e.g. Al Madina Store" value={form.name}
          onChangeText={(v) => set('name', v)} error={errors.name} />
        <Input label="Owner Name *" placeholder="e.g. Muhammad Ali" value={form.ownerName}
          onChangeText={(v) => set('ownerName', v)} error={errors.ownerName} />
        <Input label="Phone *" placeholder="e.g. 0300-1234567" value={form.phone}
          onChangeText={(v) => set('phone', v)} error={errors.phone} keyboardType="phone-pad" />
        <Input label="Address *" placeholder="e.g. Main Bazar, Lahore" value={form.address}
          onChangeText={(v) => set('address', v)} error={errors.address} multiline />

        {/* Market Selector */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerText}>Market Assignment</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Market (Optional)</Text>
          <Text style={styles.fieldHint}>Is shop ko kisi market se link karo</Text>

          {/* None option */}
          <TouchableOpacity
            style={[styles.marketOption, !selectedMarketId && styles.marketOptionActive]}
            onPress={() => setSelectedMarketId('')}
          >
            <View style={[styles.marketRadio, !selectedMarketId && styles.marketRadioActive]} />
            <Text style={[styles.marketOptionText, !selectedMarketId && styles.marketOptionTextActive]}>
              — No Market (Unassigned)
            </Text>
          </TouchableOpacity>

          {markets.map((market) => (
            <TouchableOpacity
              key={market._id}
              style={[styles.marketOption, selectedMarketId === market._id && styles.marketOptionActive]}
              onPress={() => setSelectedMarketId(market._id)}
            >
              <View style={[styles.marketRadio, selectedMarketId === market._id && styles.marketRadioActive]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.marketOptionText, selectedMarketId === market._id && styles.marketOptionTextActive]}>
                  {market.name}
                </Text>
                {market.visitDay !== 'None' && (
                  <Text style={styles.marketOptionDay}>📅 {market.visitDay}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {selectedMarket && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>
                ✓ Market: {selectedMarket.name}
                {selectedMarket.visitDay !== 'None' ? ` — ${selectedMarket.visitDay}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Login Credentials */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerText}>Login Credentials</Text>
        </View>

        <Input label="Login Username *" placeholder="e.g. almadina (must be unique)" value={form.username}
          onChangeText={(v) => set('username', v)} error={errors.username} autoCapitalize="none" />
        <Input label="Login Password *" placeholder="Min 6 characters" value={form.password}
          onChangeText={(v) => set('password', v)} error={errors.password} isPassword />
        <Input label="Opening Balance (Rs.)" placeholder="0" value={form.openingBalance}
          onChangeText={(v) => set('openingBalance', v)} error={errors.openingBalance}
          keyboardType="numeric" />

        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {submitError}</Text>
          </View>
        ) : null}

        <Button title="Create Shop" onPress={handleSubmit} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  sectionDivider: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionDividerText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.primary },

  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 2 },
  fieldHint: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: SPACING.sm },

  marketOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white, marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  marketOptionActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
  },
  marketRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.border,
  },
  marketRadioActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primary,
  },
  marketOptionText: {
    fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text,
  },
  marketOptionTextActive: { color: COLORS.primary, fontFamily: FONTS.bold },
  marketOptionDay: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },

  selectedBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.xs,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  selectedBadgeText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },

  errorBox: {
    backgroundColor: COLORS.dangerLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 4, borderLeftColor: COLORS.danger,
  },
  errorText: { color: COLORS.danger, fontFamily: FONTS.semiBold, fontSize: 14 },
  btn: { marginTop: SPACING.md },
});

export default AddShopScreen;
