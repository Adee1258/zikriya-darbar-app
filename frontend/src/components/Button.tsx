import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, ViewStyle, TextStyle, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS, FONTS } from '../constants';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'success' | 'accent';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary',
  loading = false, disabled = false,
  style, textStyle, fullWidth = true,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 24 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24 }).start();

  const isGradient = (variant === 'primary' || variant === 'accent') && !disabled && !loading;
  const gradientColors: readonly [string, string] = variant === 'accent'
    ? [COLORS.accent, COLORS.accentDark]
    : [COLORS.primary, COLORS.primaryDeep];

  const bgColor: Record<string, string> = {
    secondary: COLORS.text,
    danger: COLORS.danger,
    outline: 'transparent',
    success: COLORS.success,
  };

  const txtColor = variant === 'outline' ? COLORS.primary : COLORS.white;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';
  const shadowStyle = isGradient ? (variant === 'accent' ? SHADOWS.accent : SHADOWS.primary) : {};

  const inner = loading
    ? <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} size="small" />
    : <Text style={[styles.text, { color: txtColor }, textStyle]}>{title}</Text>;

  return (
    <Animated.View style={[
      { transform: [{ scale }] },
      fullWidth ? { width: '100%' } : undefined,
      shadowStyle,
      (disabled || loading) ? styles.disabled : undefined,
      style,
    ]}>
      {isGradient ? (
        <TouchableOpacity
          onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
          disabled={disabled || loading} activeOpacity={1}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.button, { borderColor: 'transparent' }]}
          >
            {inner}
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: bgColor[variant] || 'transparent',
            borderColor,
          }]}
          onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
          disabled={disabled || loading} activeOpacity={0.9}
        >
          {inner}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15, paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, minHeight: 54, width: '100%',
  },
  text: { fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 0.4 },
  disabled: { opacity: 0.5 },
});

export default Button;
