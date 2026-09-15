import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants';

interface Props { message?: string; }

const LoadingScreen: React.FC<Props> = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { marginTop: 12, fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
});

export default LoadingScreen;
