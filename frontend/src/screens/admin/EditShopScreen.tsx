import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList, Market } from '../../types';
import { shopsAPI, marketsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

type Route = RouteProp<AdminStackParamList, 'EditShop'>;

const EditShopScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { shopId } = route.params;

  const [form, setForm] = useState({ name: '', ownerName: '', phone: '', address: '' });
  const [loginInfo, setLoginInfo] = useState({ username: '', newPassword: '', confirmPassword: '' });
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingMarket, setSavingMarket] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setLogin = (key: string, val: string) => setLoginInfo((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    Promise.all([
      shopsAPI.getById(shopId),
      marketsAPI.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([shopRes, marketsRes]) => {
      const s = shopRes.data.data;
      setForm({ name: s.name, ownerName: s.ownerName, phone: s.phone, address: s.address });
      setLoginInfo((f) => ({ ...f, username: s.username || '' }));

      // Resolve current marketId
      const mId =
        s.marketId && typeof s.marketId === 'object'
          ? (s.marketId as { _id: string })._id
          : typeof s.marketId === 'string'
            ? s.marketId
            : '';
      setSelectedMarketId(mId);

      setMarkets(marketsRes.data.data || []);
    }).catch(() => {
      Alert.alert('Error', 'Failed to load shop');
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [shopId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await shopsAPI.update(shopId, form);
      Alert.alert('Success', 'Shop info updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update shop');
    } finally {
      setSaving(false);
    }
  };

  const handleMarketSave = async () => {
    setSavingMarket(true);
    try {
      await shopsAPI.update(shopId, { marketId: selectedMarketId || null });
      Alert.alert('Success', 'Market assignment updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update market assignment');
    } finally {
      setSavingMarket(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!loginInfo.newPassword) { Alert.alert('Error', 'Enter new password'); return; }
    if (loginInfo.newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (loginInfo.newPassword !== loginInfo.confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }

    setSavingPassword(true);
    try {
      await shopsAPI.updatePassword(shopId, loginInfo.newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setLoginInfo((f) => ({ ...f, newPassword: '', confirmPassword: '' }));
    } catch {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const selectedMarket = markets.find((m) => m._id === selectedMarketId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Shop Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          <Input label="Shop Name *" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />
          <Input label="Owner Name *" value={form.ownerName} onChangeText={(v) => set('ownerName', v)} error={errors.ownerName} />
          <Input label="Phone *" value={form.phone} onChangeText={(v) => set('phone', v)} error={errors.phone} keyboardType="phone-pad" />
          <Input label="Address *" value={form.address} onChangeText={(v) => set('address', v)} error={errors.address} multiline />
          <Button title="Save Shop Info" onPress={handleSave} loading={saving} />
        </View>

        {/* Market Assignment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏬 Market Assignment</Text>
          <Text style={styles.sectionHint}>Is shop ko kisi market se link karo ya change karo</Text>

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
                ✓ {selectedMarket.name}
                {selectedMarket.visitDay !== 'None' ? ` — ${selectedMarket.visitDay}` : ''}
              </Text>
            </View>
          )}

          <Button
            title="Save Market Assignment"
            onPress={handleMarketSave}
            loading={savingMarket}
            variant="secondary"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        {/* Login Credentials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login Credentials</Text>
          <View style={styles.usernameBox}>
            <Text style={styles.usernameLabel}>Current Username</Text>
            <Text style={styles.usernameValue}>{loginInfo.username || 'Loading...'}</Text>
          </View>
          <Input
            label="New Password"
            placeholder="Enter new password (min 6 chars)"
            value={loginInfo.newPassword}
            onChangeText={(v) => setLogin('newPassword', v)}
            isPassword
          />
          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={loginInfo.confirmPassword}
            onChangeText={(v) => setLogin('confirmPassword', v)}
            isPassword
          />
          <Button title="Update Password" onPress={handlePasswordChange} loading={savingPassword} variant="secondary" />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  section: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: {
    fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text,
    marginBottom: SPACING.xs, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sectionHint: {
    fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },

  marketOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  marketOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  marketRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.border,
  },
  marketRadioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  marketOptionText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text },
  marketOptionTextActive: { color: COLORS.primary, fontFamily: FONTS.bold },
  marketOptionDay: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },

  selectedBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.xs,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  selectedBadgeText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },

  usernameBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  usernameLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },
  usernameValue: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.primary },
});

export default EditShopScreen;
