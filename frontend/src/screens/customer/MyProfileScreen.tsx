import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Card from '../../components/Card';

const MyProfileScreen = () => {
  const { user, shop, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign Out — Are you sure you want to sign out?')) {
        logout().catch(console.error);
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => { logout().catch(console.error); } },
      ]);
    }
  };

  const rows = [
    { label: 'Shop Name', value: shop?.name || '—' },
    { label: 'Owner Name', value: shop?.ownerName || '—' },
    { label: 'Phone', value: shop?.phone || '—' },
    { label: 'Address', value: shop?.address || '—' },
    { label: 'Username', value: user?.username || '—' },
    { label: 'Opening Balance', value: formatCurrency(shop?.openingBalance ?? 0) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(shop?.name || user?.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.shopName}>{shop?.name || user?.name}</Text>
        <Text style={styles.role}>Customer Account</Text>
      </View>

      {/* Info */}
      <Card style={styles.infoCard}>
        {rows.map((row, idx) => (
          <View key={idx} style={[styles.infoRow, idx < rows.length - 1 && styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  avatarBox: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  shopName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg,
  },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
});

export default MyProfileScreen;
