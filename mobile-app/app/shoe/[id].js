import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { defaultSizes, sizeLabel } from '../../lib/sizes';
import ShoeImage from '../../components/ShoeImage';
import SizePicker from '../../components/SizePicker';
import PrimaryButton from '../../components/PrimaryButton';
import { ErrorView, LoadingView } from '../../components/StateView';
import { colors, font, spacing } from '../../theme';

// Detail: GET /api/shoes/:id (public). The one main action sits in a bar at the bottom.
// `left` / `right` params (from the AI advisor) preselect a size for each foot.
export default function ShoeScreen() {
  const { id, left, right } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [shoe, setShoe] = useState(null);
  const [sizes, setSizes] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setShoe(await apiFetch(`/api/shoes/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Preselect sizes when the shoe arrives, or when this screen is opened again with new
  // sizes from the AI advisor. `user` is left out on purpose: saving sizes on another tab
  // must not undo what the shopper just picked here.
  useEffect(() => {
    if (shoe) setSizes(defaultSizes(shoe, user, left && right ? { left, right } : null));
  }, [shoe, left, right]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!shoe || !sizes) return <LoadingView />;

  const soldOut = shoe.stock === 0;
  const label = sizeLabel(sizes.left, sizes.right);

  const handleOrder = () => {
    if (!token) {
      router.push({ pathname: '/login', params: { next: `/shoe/${id}` } });
      return;
    }
    router.push({ pathname: '/order/[id]', params: { id, left: String(sizes.left), right: String(sizes.right) } });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: shoe.name }} />
      {/* Only the content scrolls; the bottom bar stays in reach of the thumb. */}
      <ScrollView contentContainerStyle={styles.content}>
        <ShoeImage path={shoe.image_url} style={styles.image} />
        <View style={styles.body}>
          <Text style={styles.category}>{shoe.category.toUpperCase()}</Text>
          <Text style={styles.name}>{shoe.name}</Text>
          <Text style={styles.description}>{shoe.description}</Text>
          <Text style={styles.stock}>{soldOut ? 'Currently sold out' : `${shoe.stock} pairs in stock`}</Text>
          <Text style={styles.sectionTitle}>Size (US)</Text>
          <SizePicker sizes={shoe.sizes} value={sizes} onChange={setSizes} />
        </View>
      </ScrollView>

      {/* insets.bottom = the iPhone home bar (0 on most Android phones) */}
      <View style={[styles.bottomBar, { paddingBottom: spacing.md + insets.bottom }]}>
        <View>
          <Text style={styles.price}>${shoe.price.toFixed(2)}</Text>
          <Text style={styles.sizeSummary}>US {label}</Text>
        </View>
        <PrimaryButton
          title={soldOut ? 'Sold out' : token ? 'Order this pair' : 'Log in to order'}
          disabled={soldOut}
          onPress={handleOrder}
          style={styles.orderButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.lg },
  image: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: spacing.md, gap: spacing.sm },
  category: { fontSize: font.small, fontWeight: '700', letterSpacing: 1, color: colors.primary },
  name: { fontSize: font.hero, fontWeight: '800', color: colors.ink },
  description: { fontSize: font.body, color: colors.muted, lineHeight: 22 },
  stock: { fontSize: font.small, color: colors.muted },
  sectionTitle: { marginTop: spacing.sm, fontSize: font.body, fontWeight: '700', color: colors.ink },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  price: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  sizeSummary: { fontSize: font.small, color: colors.muted },
  orderButton: { flex: 1, maxWidth: 220 }
});
