import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants';
import { formatCurrency } from '../utils/format';

interface BalanceBadgeProps {
  balance: number;
  label?: string;
  size?: 'sm' | 'lg';
  style?: ViewStyle;
}

const BalanceBadge: React.FC<BalanceBadgeProps> = ({
  balance,
  label = 'Current Balance',
  size = 'lg',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, size === 'sm' && styles.amountSm]}>
        {formatCurrency(balance)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  label: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amountSm: {
    fontSize: 18,
  },
});

export default BalanceBadge;
