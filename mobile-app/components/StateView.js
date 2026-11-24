import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import PrimaryButton from './PrimaryButton';
import { colors, font, spacing } from '../theme';

// No screen is ever just blank: it is loading, empty, or shows what went wrong.
export function LoadingView({ message = 'Loading…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <PrimaryButton title="Try again" variant="secondary" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

export function EmptyView({ icon = 'footsteps-outline', message, actionTitle, onAction }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={colors.muted} />
      <Text style={styles.text}>{message}</Text>
      {onAction ? <PrimaryButton title={actionTitle} onPress={onAction} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  text: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  button: { minWidth: 180 }
});
