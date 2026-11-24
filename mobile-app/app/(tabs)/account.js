import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL, apiFetch, AuthError } from '../../lib/api';
import { useAuth, useSessionExpired } from '../../lib/auth';
import { MAX_FOOT_SIZE, MIN_FOOT_SIZE } from '../../lib/sizes';
import Stepper from '../../components/Stepper';
import PrimaryButton from '../../components/PrimaryButton';
import { LoadingView } from '../../components/StateView';
import { cardShadow, colors, font, radius, spacing } from '../../theme';

// Account: the saved size of each foot (PUT /api/auth/me/sizes) and logging out.
export default function AccountScreen() {
  const router = useRouter();
  const { token, user, isRestoring, signOut, updateUser } = useAuth();
  const sessionExpired = useSessionExpired();
  const [leftSize, setLeftSize] = useState(9);
  const [rightSize, setRightSize] = useState(9);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.left_size != null && user?.right_size != null) {
      setLeftSize(user.left_size);
      setRightSize(user.right_size);
    }
  }, [user?.left_size, user?.right_size]);

  if (isRestoring) return <LoadingView />;

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Welcome to Finishline</Text>
        <Text style={styles.muted}>Log in or create an account to order and see your orders.</Text>
        <PrimaryButton title="Log in" onPress={() => router.push('/login')} style={styles.wide} />
        <PrimaryButton
          title="Create account"
          variant="secondary"
          onPress={() => router.push({ pathname: '/login', params: { mode: 'register' } })}
          style={styles.wide}
        />
      </View>
    );
  }

  const saveSizes = async (left, right) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await apiFetch('/api/auth/me/sizes', {
        method: 'PUT',
        token,
        body: { left_size: left, right_size: right }
      });
      await updateUser(response.user);
      setMessage(left === null ? 'Saved sizes cleared.' : 'Saved. Every shoe now opens with these sizes, on the phone and on the web.');
    } catch (err) {
      if (err instanceof AuthError) {
        await sessionExpired('/account');
        return;
      }
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{user.username}</Text>
        <Text style={styles.muted}>{user.role === 'administrator' ? 'Administrator — store tools are on the web app' : 'Client account'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My shoe sizes</Text>
        <Text style={styles.muted}>Different sizes? Save both: product pages preselect them.</Text>
        <Stepper label="Left foot (US)" value={leftSize} onChange={setLeftSize} min={MIN_FOOT_SIZE} max={MAX_FOOT_SIZE} step={0.5} />
        <Stepper label="Right foot (US)" value={rightSize} onChange={setRightSize} min={MIN_FOOT_SIZE} max={MAX_FOOT_SIZE} step={0.5} />
        <PrimaryButton title="Save my sizes" busy={busy} onPress={() => saveSizes(leftSize, rightSize)} />
        {user.left_size != null && (
          <PrimaryButton title="Clear saved sizes" variant="secondary" disabled={busy} onPress={() => saveSizes(null, null)} />
        )}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <PrimaryButton title="Log out" variant="secondary" onPress={signOut} />
      <Text style={styles.server}>Server: {API_URL || 'not set (.env)'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  wide: { alignSelf: 'stretch' },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.card, ...cardShadow },
  title: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  sectionTitle: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  muted: { fontSize: font.small, color: colors.muted },
  message: { fontSize: font.small, color: colors.ink },
  server: { fontSize: font.small, color: colors.muted, textAlign: 'center' }
});
