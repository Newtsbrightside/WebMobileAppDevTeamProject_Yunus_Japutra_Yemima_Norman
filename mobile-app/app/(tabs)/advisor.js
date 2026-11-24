import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiFetch, AuthError } from '../../lib/api';
import { useAuth, useSessionExpired } from '../../lib/auth';
import { MAX_FOOT_SIZE, MIN_FOOT_SIZE, sizeLabel } from '../../lib/sizes';
import Stepper from '../../components/Stepper';
import PrimaryButton from '../../components/PrimaryButton';
import ShoeImage from '../../components/ShoeImage';
import AiLabel from '../../components/AiLabel';
import { EmptyView, LoadingView } from '../../components/StateView';
import { cardShadow, colors, font, radius, spacing, touchTarget } from '../../theme';

const ACTIVITIES = ['Everyday', 'Running', 'Basketball', 'Casual', 'Lifestyle'];

function PickCard({ pick, onOpen }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${pick.shoe.name}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.pick, pressed && styles.pressed]}
    >
      <ShoeImage path={pick.shoe.image_url} style={styles.pickImage} />
      <View style={styles.pickBody}>
        <Text style={styles.pickName}>{pick.shoe.name}</Text>
        <Text style={styles.pickMeta}>${pick.shoe.price.toFixed(2)} · order US {sizeLabel(pick.left_size, pick.right_size)}</Text>
        <Text style={[styles.badge, pick.exact_fit && styles.badgeExact]}>{pick.exact_fit ? 'Exact fit' : 'Half size up'}</Text>
        {pick.reason ? <Text style={styles.reason}>{pick.reason}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

// AI Fit Advisor: POST /api/ai/fit-advice. The LLM is called by OUR server;
// the app never holds an AI key. AI text is always labelled.
export default function AdvisorScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { token, user, isRestoring, updateUser } = useAuth();
  const sessionExpired = useSessionExpired();
  const [leftSize, setLeftSize] = useState(user?.left_size ?? 9);
  const [rightSize, setRightSize] = useState(user?.right_size ?? 9);
  const [activity, setActivity] = useState('Everyday');
  const [notes, setNotes] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [fallback, setFallback] = useState(null);
  const [error, setError] = useState('');

  // The tab stays mounted, so pick up the saved sizes after a login or a save on another tab.
  useEffect(() => {
    if (user?.left_size != null && user?.right_size != null) {
      setLeftSize(user.left_size);
      setRightSize(user.right_size);
    }
  }, [user?.left_size, user?.right_size]);

  if (isRestoring) return <LoadingView />;
  if (!token) {
    return (
      <EmptyView
        icon="sparkles-outline"
        message="Log in to ask the AI which shoes fit both of your feet."
        actionTitle="Log in"
        onAction={() => router.push({ pathname: '/login', params: { next: '/advisor' } })}
      />
    );
  }

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setAdvice(null);
    setFallback(null);
    try {
      if (remember && (leftSize !== user?.left_size || rightSize !== user?.right_size)) {
        const saved = await apiFetch('/api/auth/me/sizes', {
          method: 'PUT',
          token,
          body: { left_size: leftSize, right_size: rightSize }
        });
        await updateUser(saved.user);
      }
      setAdvice(await apiFetch('/api/ai/fit-advice', {
        method: 'POST',
        token,
        body: { left_size: leftSize, right_size: rightSize, activity, notes }
      }));
    } catch (err) {
      if (err instanceof AuthError) {
        await sessionExpired('/advisor');
        return;
      }
      // The AI being slow or down is not a crash: show the message and the size-matched list.
      setError(err.message);
      setFallback(err.data?.fallback_picks || null);
    } finally {
      setBusy(false);
    }
  };

  const openPick = pick => router.push({
    pathname: '/shoe/[id]',
    params: { id: pick.shoe.id, left: String(pick.left_size), right: String(pick.right_size) }
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Feet are often not the same size. Tell us both, and the AI picks the shoes that fit each foot.</Text>

        <View style={styles.card}>
          <Stepper label="Left foot (US)" value={leftSize} onChange={setLeftSize} min={MIN_FOOT_SIZE} max={MAX_FOOT_SIZE} step={0.5} />
          <Stepper label="Right foot (US)" value={rightSize} onChange={setRightSize} min={MIN_FOOT_SIZE} max={MAX_FOOT_SIZE} step={0.5} />
          <View style={styles.rememberRow}>
            <Text style={styles.rememberText}>Remember my sizes (web and phone)</Text>
            <Switch value={remember} onValueChange={setRemember} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        <Text style={styles.label}>Mostly for</Text>
        <View style={styles.chips}>
          {ACTIVITIES.map(item => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Activity ${item}`}
              accessibilityState={{ selected: activity === item }}
              onPress={() => setActivity(item)}
              hitSlop={4}
              style={[styles.chip, activity === item && styles.chipSelected]}
            >
              <Text style={[styles.chipText, activity === item && styles.chipTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Anything else? (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. wide feet, budget under $150"
          placeholderTextColor={colors.muted}
          maxLength={300}
          multiline
          style={styles.notes}
        />

        <PrimaryButton title="Get my recommendation" busy={busy} onPress={ask} />
        {busy && <Text style={styles.muted}>Asking the AI… this can take a few seconds.</Text>}

        {error ? (
          <View style={styles.warning}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : null}

        {advice && (
          <View style={styles.result}>
            {advice.ai_generated && <AiLabel model={advice.model} />}
            <Text style={styles.summary}>{advice.summary}</Text>
            {advice.picks.map(pick => <PickCard key={pick.shoe.id} pick={pick} onOpen={() => openPick(pick)} />)}
            {advice.tips ? <Text style={styles.muted}>Tip: {advice.tips}</Text> : null}
            {advice.ai_generated && <Text style={styles.muted}>AI suggestions can be wrong. Check the size chart before you buy.</Text>}
          </View>
        )}

        {fallback && fallback.length > 0 && (
          <View style={styles.result}>
            <AiLabel notAi />
            {fallback.map(pick => <PickCard key={pick.shoe.id} pick={pick} onOpen={() => openPick(pick)} />)}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  intro: { fontSize: font.body, color: colors.muted, lineHeight: 22 },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.card, ...cardShadow },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rememberText: { flex: 1, fontSize: font.small, color: colors.muted },
  label: { fontSize: font.body, fontWeight: '600', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget - spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    justifyContent: 'center'
  },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: font.small, fontWeight: '600', color: colors.ink },
  chipTextSelected: { color: colors.card },
  notes: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    fontSize: font.body,
    color: colors.ink,
    textAlignVertical: 'top'
  },
  muted: { fontSize: font.small, color: colors.muted },
  warning: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.errorBackground },
  warningText: { flex: 1, fontSize: font.small, color: colors.ink },
  result: { gap: spacing.md },
  summary: { fontSize: font.body, color: colors.ink, lineHeight: 22 },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    ...cardShadow
  },
  pressed: { opacity: 0.85 },
  pickImage: { width: 64, height: 64, borderRadius: radius.md },
  pickBody: { flex: 1, gap: spacing.xs },
  pickName: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  pickMeta: { fontSize: font.small, color: colors.muted },
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.ink,
    backgroundColor: colors.line
  },
  badgeExact: { backgroundColor: colors.lime },
  reason: { fontSize: font.small, color: colors.ink }
});
