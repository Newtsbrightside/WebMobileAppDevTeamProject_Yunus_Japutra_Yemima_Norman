import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing, touchTarget } from '../theme';

// The main button. While a request runs (`busy`) it shows a spinner and ignores taps,
// so a slow network can never turn one tap into two orders.
export default function PrimaryButton({ title, onPress, busy = false, disabled = false, variant = 'primary', style }) {
  const isSecondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        pressed && !isSecondary && styles.primaryPressed,
        (disabled || busy) && styles.disabled,
        style
      ]}
    >
      {busy
        ? <ActivityIndicator color={isSecondary ? colors.ink : colors.onPrimary} />
        : <Text style={[styles.label, isSecondary && styles.secondaryLabel]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  disabled: { opacity: 0.5 },
  label: { color: colors.onPrimary, fontSize: font.body, fontWeight: '700' },
  secondaryLabel: { color: colors.ink }
});
