import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';

const { height } = Dimensions.get('window');

const LoginScreen = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full gradient background */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradientBg}
      />

      {/* Decorative circles */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <View style={styles.deco3} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentDark]}
              style={styles.logoContainer}
            >
              <Text style={styles.logo}>🏪</Text>
            </LinearGradient>
            <Text style={styles.appName}>Zikriya Darbar</Text>
            <View style={styles.taglinePill}>
              <Text style={styles.tagline}>Premium Wholesale</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Welcome back! Enter your credentials</Text>

            <View style={styles.divider} />

            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isPassword
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Button title="Sign In →" onPress={handleLogin} loading={loading} style={styles.loginBtn} />
          </View>

          <Text style={styles.footer}>© 2026 Zikriya Darbar — All Rights Reserved</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDeep },
  flex: { flex: 1 },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  deco1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -100, right: -80,
  },
  deco2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.1)',
    top: 60, left: -60,
  },
  deco3: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 200, right: -40,
  },
  scroll: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center', paddingTop: height * 0.1 },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoContainer: {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.accent,
  },
  logo: { fontSize: 44 },
  appName: {
    fontSize: 30, fontFamily: FONTS.heavy, color: COLORS.white,
    letterSpacing: 0.5, marginBottom: SPACING.sm,
  },
  taglinePill: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  tagline: {
    fontSize: 13, fontFamily: FONTS.semiBold,
    color: COLORS.accent, letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  cardTitle: {
    fontSize: 26, fontFamily: FONTS.heavy, color: COLORS.text, marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: SPACING.md,
  },
  divider: {
    height: 1, backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  loginBtn: { marginTop: SPACING.sm },
  footer: {
    textAlign: 'center', fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: SPACING.xl,
  },
});

export default LoginScreen;
