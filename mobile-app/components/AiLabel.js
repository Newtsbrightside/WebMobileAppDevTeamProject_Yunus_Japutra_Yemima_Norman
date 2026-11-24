import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius, spacing } from '../theme';

// Every piece of AI-written text is labelled, so the user knows where it came from.
export default function AiLabel({ model, notAi = false }) {
  return (
    <View style={[styles.pill, notAi && styles.notAi]}>
      {!notAi && <Ionicons name="sparkles" size={12} color={colors.lime} />}
      <Text style={[styles.text, notAi && styles.notAiText]}>
        {notAi ? 'Size match · not written by AI' : `AI-generated${model ? ` · ${model}` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.ink
  },
  text: { color: colors.lime, fontSize: font.small, fontWeight: '600' },
  notAi: { backgroundColor: colors.line },
  notAiText: { color: colors.ink }
});
