import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { authAPI, adminAPI } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';

const AdminProfileScreen = () => {
  const { user, updateUser, logout } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Reset State
  const [resetting, setResetting] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Validation Error', 'Name and Username cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(name.trim(), username.trim());
      updateUser(res.data.data);
      Alert.alert('Success ✅', 'Profile updated successfully!');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile';
      Alert.alert('Update Failed ❌', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success ✅', 'Password changed successfully!');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password';
      Alert.alert('Password Change Failed ❌', msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout().catch(console.error) },
    ]);
  };

  const handleResetAllData = () => {
    // First confirmation
    Alert.alert(
      '⚠️ Delete All Data',
      'Yeh action sari shops, orders, payments aur ledger entries delete kar dega.\n\nAdmin account safe rahega.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Haan, Delete Karo',
          style: 'destructive',
          onPress: () => {
            // Second confirmation — final guard
            Alert.alert(
              '🔴 Bilkul Pakka?',
              'Yeh data wapas nahi aayega. Kya aap sure hain?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'DELETE ALL',
                  style: 'destructive',
                  onPress: async () => {
                    setResetting(true);
                    try {
                      const res = await adminAPI.resetAllData();
                      const { deleted } = res.data;
                      Alert.alert(
                        '✅ Reset Complete',
                        `Sab data delete ho gaya!\n\n` +
                        `Markets: ${deleted.markets}\n` +
                        `Shops: ${deleted.shops}\n` +
                        `Orders: ${deleted.orders}\n` +
                        `Payments: ${deleted.payments}\n` +
                        `Ledger entries: ${deleted.ledgerEntries}\n` +
                        `Customer accounts: ${deleted.customerUsers}`
                      );
                    } catch {
                      Alert.alert('Error ❌', 'Data reset nahi hua. Dobara try karein.');
                    } finally {
                      setResetting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Avatar Card */}
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeaderCard}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>🛡️</Text>
          </View>
          <Text style={styles.headerName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>ADMIN ACCOUNT</Text>
          </View>
          <Text style={styles.headerUsername}>@{user?.username}</Text>
        </LinearGradient>

        {/* Section 1: Edit Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Profile Details</Text>
          <Text style={styles.cardSubtitle}>Update your display name and username</Text>

          <View style={styles.divider} />

          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Username"
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Button
            title="Save Profile Changes"
            onPress={handleUpdateProfile}
            loading={savingProfile}
            style={styles.saveBtn}
          />
        </View>

        {/* Section 2: Change Password */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Change Password</Text>
          <Text style={styles.cardSubtitle}>Ensure your admin account uses a strong password</Text>

          <View style={styles.divider} />

          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
          />

          <Input
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          <Button
            title="Update Password"
            variant="accent"
            onPress={handleChangePassword}
            loading={savingPassword}
            style={styles.saveBtn}
          />
        </View>

        {/* Danger Zone: Reset All Data */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>🗑️ Danger Zone</Text>
          <Text style={styles.dangerSubtitle}>
            Sari shops, orders, payments aur ledger entries delete ho jayengi.{'\n'}
            Admin account safe rahega.
          </Text>
          <View style={styles.divider} />
          <Button
            title={resetting ? 'Deleting...' : '🔴 Delete All Data'}
            onPress={handleResetAllData}
            loading={resetting}
            style={styles.resetBtn}
          />
        </View>

        {/* Logout Option */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutTitle}>Sign Out of Admin Account</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md },

  // Header Banner
  profileHeaderCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarIcon: { fontSize: 38 },
  headerName: { fontSize: 22, fontFamily: FONTS.heavy, color: COLORS.white, marginBottom: 4 },
  roleBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: 6,
  },
  roleText: { fontSize: 10, fontFamily: FONTS.heavy, color: COLORS.primaryDeep, letterSpacing: 1 },
  headerUsername: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)' },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginBottom: SPACING.md },
  saveBtn: { marginTop: SPACING.xs },

  // Danger Zone Card
  dangerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(220,38,38,0.35)',
    ...SHADOWS.sm,
  },
  dangerTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
    marginBottom: 4,
  },
  dangerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: COLORS.danger,
    marginTop: SPACING.xs,
  },

  // Logout Card
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
    marginBottom: SPACING.md,
  },
  logoutIcon: { fontSize: 18, marginRight: 8 },
  logoutTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.danger },
});

export default AdminProfileScreen;
