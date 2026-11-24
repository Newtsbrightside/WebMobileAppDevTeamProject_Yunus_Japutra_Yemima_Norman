import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import ShoeImage from '../../components/ShoeImage';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import { cardShadow, colors, font, radius, spacing, touchTarget } from '../../theme';

const CATEGORY_KEY = 'finishline.category'; // a plain setting, so AsyncStorage is fine

// Shop: GET /api/shoes (public, no token needed).
export default function ShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [shoes, setShoes] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    try {
      setShoes(await apiFetch('/api/shoes'));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    // Open on the category the user picked last time.
    AsyncStorage.getItem(CATEGORY_KEY).then(saved => {
      if (saved) setCategory(saved);
    });
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const selectCategory = value => {
    setCategory(value);
    AsyncStorage.setItem(CATEGORY_KEY, value);
  };

  if (status === 'loading') return <LoadingView message="Loading the collection…" />;
  if (status === 'error') {
    return <ErrorView message={error} onRetry={() => { setStatus('loading'); load(); }} />;
  }

  const categories = ['All', ...new Set(shoes.map(shoe => shoe.category))];
  const visible = category === 'All' ? shoes : shoes.filter(shoe => shoe.category === category);
  const hasSplitSizes = user?.left_size != null && user.left_size !== user.right_size;

  return (
    <FlatList
      data={visible}
      keyExtractor={shoe => shoe.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.hero}>Find your pace.</Text>
          {hasSplitSizes && (
            <Text style={styles.note}>Your sizes L {user.left_size} / R {user.right_size} are preselected on every shoe.</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map(item => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Category ${item}`}
                accessibilityState={{ selected: category === item }}
                onPress={() => selectCategory(item)}
                hitSlop={4}
                style={[styles.chip, category === item && styles.chipSelected]}
              >
                <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<EmptyView message="No shoes in this category yet." />}
      renderItem={({ item: shoe }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${shoe.name}, $${shoe.price}`}
          onPress={() => router.push(`/shoe/${shoe.id}`)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <ShoeImage path={shoe.image_url} style={styles.image} />
          <View style={styles.cardBody}>
            <Text style={styles.category}>{shoe.category.toUpperCase()}</Text>
            <Text style={styles.name}>{shoe.name}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.price}>${shoe.price.toFixed(2)}</Text>
              <Text style={[styles.stock, shoe.stock === 0 && styles.soldOut]}>
                {shoe.stock === 0 ? 'Sold out' : `US ${shoe.sizes[0]}–${shoe.sizes[shoe.sizes.length - 1]}`}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  hero: { fontSize: font.hero, fontWeight: '800', color: colors.ink },
  note: { fontSize: font.small, color: colors.muted },
  chips: { gap: spacing.sm, paddingVertical: spacing.sm },
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
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', ...cardShadow },
  cardPressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 4 / 3 },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  category: { fontSize: font.small, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
  name: { fontSize: font.title, fontWeight: '700', color: colors.ink },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  price: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  stock: { fontSize: font.small, color: colors.muted },
  soldOut: { color: colors.error, fontWeight: '700' }
});
