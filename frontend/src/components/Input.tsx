import React, { useState, forwardRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TextInputProps, TouchableOpacity, ViewStyle, Platform,
  NativeSyntheticEvent, TextInputFocusEventData,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../constants';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  containerStyle,
  isPassword = false,
  style,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // IMPORTANT: We destructure onFocus/onBlur from props ABOVE so they don't
  // end up in {...rest}. Previously {...props} was spread AFTER the inline
  // onFocus/onBlur on TextInput, which would overwrite them with the parent's
  // handlers (or undefined), breaking the isFocused state entirely.

  const handleFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocusProp?.(e);
  }, [onFocusProp]);

  const handleBlur = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlurProp?.(e);
  }, [onBlurProp]);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {/* 
        CRITICAL: Do NOT change backgroundColor or elevation on this wrapper
        based on isFocused state. On Android, changing the parent View's 
        backgroundColor causes a native re-layout that immediately steals 
        focus from the TextInput, creating a focus→blur→focus loop.
        
        Only borderColor change is safe on Android.
      */}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null,
      ]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={togglePassword}
            style={styles.eyeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontSize: 13, fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary, marginBottom: 7, letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface,
  },
  inputFocused: {
    // ONLY change borderColor on focus — this is safe on Android.
    // Do NOT change backgroundColor, elevation, or shadow here.
    // Changing backgroundColor on the parent View of a TextInput on Android
    // triggers a native re-layout that causes the TextInput to lose focus instantly.
    borderColor: COLORS.primary,
  },
  inputError: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  input: {
    flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 15,
    fontSize: 15, fontFamily: FONTS.medium, color: COLORS.text, minHeight: 54,
  },
  eyeBtn: { paddingHorizontal: SPACING.md, justifyContent: 'center' },
  eyeText: { fontSize: 18, opacity: 0.6 },
  errorText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.danger, marginTop: 5, marginLeft: 2 },
});

export default Input;
