import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, AuthError } from '../../lib/api';
import { useAuth, useSessionExpired } from '../../lib/auth';
import { sizeLabel } from '../../lib/sizes';
import ShoeImage from '../../components/ShoeImage';
import Stepper from '../../components/Stepper';
import PrimaryButton from '../../components/PrimaryButton';
import { ErrorView, LoadingView } from '../../components/StateView';
import { cardShadow, colors, font, radius, spacing, touchTarget } from '../../theme';

const MAX_PAIRS = 5;

// Order form: POST /api/orders with the token. The server reads the price and takes the stock.
export default function OrderScreen() {
  const { id, left, right } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { token, user, isRestoring } = useAuth();
  const sessionExpired = useSessionExpired();
  const addressRef = useRef(null);

  const [shoe, setShoe] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leftSize = Number(left);
  const rightSize = Number(right);

  useEffect(() => {
    apiFetch(`/api/shoes/${id}`).then(setShoe).catch(err => setLoadError(err.message));
  }, [id]);

  if (isRestoring) return <LoadingView />;
  // Logged out: log in first, then come back to this form.
  if (!token) {
    return <Redirect href={{ pathname: '/login', params: { next: `/order/${id}?left=${left}&right=${right}` } }} />;
  }
  if (loadError) return <ErrorView message={loadError} />;
  if (!shoe) return <LoadingView />;

  const maxPairs = Math.max(1, Math.min(MAX_PAIRS, shoe.stock));

  // Checked on the phone first for comfort; the server checks again for safety.
  const validate = () => {
    const found = {};
    if (!name.trim()) found.name = 'Enter the name for the delivery.';
    if (address.trim().length < 8) found.address = 'Enter the full delivery address.';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validate()) return;
    setSubmitError('');
    setIsSubmitting(true); // one tap = one order
    try {
      const order = await apiFetch('/api/orders', {
        method: 'POST',
        token,
        body: {
          customer: { name: name.trim(), address: address.trim() },
          items: [{ id: shoe.id, quantity, left_size: leftSize, right_size: rightSize }]
        }
      });
      router.dismissAll(); // close detail + form, back to the tabs
      router.navigate({ pathname: '/orders', params: { placed: order.id } });
    } catch (err) {
      if (err instanceof AuthError) {
        await sessionExpired(`/order/${id}?left=${left}&right=${right}`);
        return;
      }
      setSubmitError(err.message); // e.g. "Not enough stock" — shown under the button
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={text => { setName(text); setErrors(current => ({ ...current, name: null })); }}
          placeholder={user?.username || 'Your name'}
          placeholderTextColor={colors.muted}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => addressRef.current?.focus()}
          style={[styles.input, errors.name && styles.inputError]}
        />
        {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}

        <Text style={styles.label}>Delivery address</Text>
        <TextInput
          ref={addressRef}
          value={address}
          onChangeText={text => { setAddress(text); setErrors(current => ({ ...current, address: null })); }}
          placeholder="Street, number, city"
          placeholderTextColor={colors.muted}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          multiline
          style={[styles.input, styles.multiline, errors.address && styles.inputError]}
        />
        {errors.address ? <Text style={styles.fieldError}>{errors.address}</Text> : null}

        <View style={styles.summary}>
          <ShoeImage path={shoe.image_url} style={styles.thumb} />
          <View style={styles.summaryText}>
            <Text style={styles.shoeName}>{shoe.name}</Text>
            <Text style={styles.muted}>US {sizeLabel(leftSize, rightSize)}</Text>
            {leftSize !== rightSize && (
              <Text style={styles.splitNote}>Left {leftSize} · Right {rightSize} — one pair, two sizes</Text>
            )}
          </View>
        </View>

        <Stepper label="Pairs" value={quantity} onChange={setQuantity} min={1} max={maxPairs} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: spacing.md + insets.bottom }]}>
        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        <View style={styles.totalRow}>
          <Text style={styles.muted}>Total</Text>
          <Text style={styles.total}>${(shoe.price * quantity).toFixed(2)}</Text>
        </View>
        <PrimaryButton title="Place order" busy={isSubmitting} onPress={handleSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.sm },
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
  multiline: { minHeight: 88, paddingTop: spacing.md, textAlignVertical: 'top' },
  inputError: { borderColor: colors.error },
  fieldError: { color: colors.error, fontSize: font.small },
  summary: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    ...cardShadow
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  summaryText: { flex: 1, gap: spacing.xs },
  shoeName: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  muted: { fontSize: font.small, color: colors.muted },
  splitNote: { fontSize: font.small, color: colors.primary, fontWeight: '600' },
  bottomBar: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  submitError: { color: colors.error, fontSize: font.small, backgroundColor: colors.errorBackground, padding: spacing.sm, borderRadius: radius.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: font.title, fontWeight: '800', color: colors.ink }
});
