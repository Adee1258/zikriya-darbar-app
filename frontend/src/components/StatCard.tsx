import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS, FONTS } from '../constants';
import Card from './Card';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = COLORS.primary, style }) => {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1, marginHorizontal: 4, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
  },
  header: { marginBottom: SPACING.sm },
  iconContainer: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  label: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontFamily: FONTS.heavy,
    letterSpacing: -0.5,
  },
});

export default StatCard;
