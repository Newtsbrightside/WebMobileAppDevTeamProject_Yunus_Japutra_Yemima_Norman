import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius, spacing, touchTarget } from '../theme';

function StepButton({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

// Tap instead of type: no number keyboard and no invalid values.
// Used for quantities (step 1) and foot sizes (step 0.5).
export default function Stepper({ label, value, onChange, min, max, step = 1, format = String }) {
  const change = direction => {
    const next = Math.round((value + direction * step) * 2) / 2;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controls}>
        <StepButton icon="remove" label={`Decrease ${label || 'value'}`} onPress={() => change(-1)} disabled={value <= min} />
        <Text style={styles.value} accessibilityLiveRegion="polite">{format(value)}</Text>
        <StepButton icon="add" label={`Increase ${label || 'value'}`} onPress={() => change(1)} disabled={value >= max} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { fontSize: font.body, color: colors.ink, fontWeight: '600', flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: { backgroundColor: colors.paper },
  disabled: { opacity: 0.35 },
  value: { minWidth: 56, textAlign: 'center', fontSize: font.title, fontWeight: '700', color: colors.ink }
});
