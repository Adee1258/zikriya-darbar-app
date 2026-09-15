import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onAction, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <Text style={styles.action} onPress={onAction}>{actionLabel}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm, marginTop: SPACING.md,
  },
  title: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.text, letterSpacing: 0.2 },
  action: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.primary },
});

export default SectionHeader;
