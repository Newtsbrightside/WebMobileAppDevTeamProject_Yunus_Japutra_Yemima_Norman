import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, font, radius, spacing, touchTarget } from '../theme';

function SizeRow({ sizes, selected, onSelect, label }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {sizes.map(size => {
        const isSelected = Number(selected) === Number(size);
        return (
          <Pressable
            key={size}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${label} ${size}`}
            onPress={() => onSelect(size)}
            style={[styles.size, isSelected && styles.sizeSelected]}
          >
            <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>{size}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// One size for both feet, or — switched on — a different size for each foot.
// value: { left, right, split }
export default function SizePicker({ sizes, value, onChange }) {
  const toggleSplit = split => onChange({ ...value, split, right: split ? value.right : value.left });

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>My feet are different sizes</Text>
          <Text style={styles.switchHint}>Pick a size for each foot. Still one pair, same price.</Text>
        </View>
        <Switch
          value={value.split}
          onValueChange={toggleSplit}
          trackColor={{ true: colors.primary }}
          accessibilityLabel="My feet are different sizes"
        />
      </View>

      {value.split ? (
        <>
          <Text style={styles.footLabel}>LEFT FOOT</Text>
          <SizeRow sizes={sizes} selected={value.left} label="Left foot size" onSelect={size => onChange({ ...value, left: size })} />
          <Text style={styles.footLabel}>RIGHT FOOT</Text>
          <SizeRow sizes={sizes} selected={value.right} label="Right foot size" onSelect={size => onChange({ ...value, right: size })} />
        </>
      ) : (
        <SizeRow sizes={sizes} selected={value.left} label="Size" onSelect={size => onChange({ ...value, left: size, right: size })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  switchText: { flex: 1, gap: spacing.xs },
  switchTitle: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  switchHint: { fontSize: font.small, color: colors.muted },
  footLabel: { marginTop: spacing.sm, fontSize: font.small, fontWeight: '700', letterSpacing: 1, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  size: {
    minWidth: touchTarget + spacing.md,
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sizeSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  sizeText: { fontSize: font.body, fontWeight: '600', color: colors.ink },
  sizeTextSelected: { color: colors.card }
});
