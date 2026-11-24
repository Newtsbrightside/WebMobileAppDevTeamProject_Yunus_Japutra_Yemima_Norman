import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, radius, spacing, touchTarget } from '../theme';

// Log in (POST /api/auth/login) or create a client account (POST /api/auth/register).
// `next` is where to go afterwards, e.g. back to the order form.
export default function LoginScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { signIn } = useAuth();
  const passwordRef = useRef(null);

  const [mode, setMode] = useState(params.mode === 'register' ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const validate = () => {
    const found = {};
    if (username.trim().length < 3) found.username = 'Username must be at least 3 characters.';
    if (password.length < 4) found.password = 'Password must be at least 4 characters.';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validate()) return;
    setServerError('');
    setIsSubmitting(true);
    try {
      const data = await apiFetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password }
      });
      await signIn(data.token, data.user);
      // replace, so "back" does not return to the login form
      router.replace(params.next || '/');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isRegister ? 'Create an account' : 'Welcome back.'}</Text>
        {params.expired ? <Text style={styles.notice}>Your session has expired. Please log in again.</Text> : null}

        <View style={styles.tabs}>
          {['login', 'register'].map(item => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={item === 'login' ? 'Log in mode' : 'Create account mode'}
              accessibilityState={{ selected: mode === item }}
              onPress={() => { setMode(item); setServerError(''); setErrors({}); }}
              style={[styles.tab, mode === item && styles.tabSelected]}
            >
              <Text style={[styles.tabText, mode === item && styles.tabTextSelected]}>
                {item === 'login' ? 'Log in' : 'Create account'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={text => { setUsername(text); setErrors(current => ({ ...current, username: null })); }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="e.g. client"
          placeholderTextColor={colors.muted}
          style={[styles.input, errors.username && styles.inputError]}
        />
        {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={text => { setPassword(text); setErrors(current => ({ ...current, password: null })); }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isRegister ? 'new-password' : 'password'}
          textContentType={isRegister ? 'newPassword' : 'password'}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          style={[styles.input, errors.password && styles.inputError]}
        />
        {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
        <PrimaryButton title={isRegister ? 'Create account' : 'Log in'} busy={isSubmitting} onPress={handleSubmit} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.sm },
  title: { fontSize: font.hero, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  notice: { fontSize: font.small, color: colors.ink, backgroundColor: colors.lime, padding: spacing.sm, borderRadius: radius.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  tabSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontSize: font.body, fontWeight: '600', color: colors.ink },
  tabTextSelected: { color: colors.card },
  label: { fontSize: font.body, fontWeight: '600', color: colors.ink, marginTop: spacing.sm },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
    color: colors.ink
  },
  inputError: { borderColor: colors.error },
  fieldError: { color: colors.error, fontSize: font.small },
  serverError: { color: colors.error, fontSize: font.small, backgroundColor: colors.errorBackground, padding: spacing.sm, borderRadius: radius.md },
  submit: { marginTop: spacing.md }
});
