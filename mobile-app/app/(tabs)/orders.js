import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiFetch, AuthError } from '../../lib/api';
import { useAuth, useSessionExpired } from '../../lib/auth';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import { cardShadow, colors, font, radius, spacing } from '../../theme';

const STATUS_COLORS = {
  Pending: '#8a6d00',
  Processing: '#1565c0',
  Shipped: '#6a1b9a',
  Delivered: colors.success,
  Cancelled: colors.error
};

// My orders: GET /api/orders/mine with the token.
// The SERVER decides whose orders these are (from the token), never the app.
export default function OrdersScreen() {
  const router = useRouter();
  const { placed } = useLocalSearchParams();
  const { token, isRestoring } = useAuth();
  const sessionExpired = useSessionExpired();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      setOrders(await apiFetch('/api/orders/mine', { token }));
    } catch (err) {
      if (err instanceof AuthError) {
        await sessionExpired('/orders');
        return;
      }
      setError(err.message);
    }
  }, [token, sessionExpired]);

  // Reload every time the tab is opened, so a status changed on the web shows up here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (isRestoring) return <LoadingView />;
  if (!token) {
    return (
      <EmptyView
        icon="receipt-outline"
        message="Log in to see your orders."
        actionTitle="Log in"
        onAction={() => router.push({ pathname: '/login', params: { next: '/orders' } })}
      />
    );
  }
  if (error && !orders) return <ErrorView message={error} onRetry={load} />;
  if (!orders) return <LoadingView message="Loading your orders…" />;

  return (
    <FlatList
      data={orders}
      keyExtractor={order => order.id}
      contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={placed ? (
        <View style={styles.placed}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.placedText}>Order {placed} placed. We will update its status here.</Text>
        </View>
      ) : null}
      ListEmptyComponent={
        <EmptyView message="No orders yet." actionTitle="Browse shoes" onAction={() => router.navigate('/')} />
      }
      renderItem={({ item: order }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={[styles.status, { color: STATUS_COLORS[order.status] || colors.ink }]}>{order.status}</Text>
          </View>
          <Text style={styles.date}>{new Date(order.created_at).toLocaleString()}</Text>
          {order.items.map((item, index) => (
            <View key={`${order.id}-${index}`} style={styles.item}>
              <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
              <Text style={styles.itemSize}>US {item.selectedSize}</Text>
              {item.split_size && <Text style={styles.split}>Different size for each foot</Text>}
            </View>
          ))}
          <View style={styles.cardFooter}>
            <Text style={styles.muted} numberOfLines={1}>{order.delivery_address}</Text>
            <Text style={styles.total}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  emptyList: { flexGrow: 1 },
  placed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#e8f5e9'
  },
  placedText: { flex: 1, fontSize: font.small, color: colors.ink },
  card: { padding: spacing.md, gap: spacing.xs, borderRadius: radius.md, backgroundColor: colors.card, ...cardShadow },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  status: { fontSize: font.body, fontWeight: '700' },
  date: { fontSize: font.small, color: colors.muted },
  item: { marginTop: spacing.sm, gap: spacing.xs },
  itemName: { fontSize: font.body, color: colors.ink },
  itemSize: { fontSize: font.small, color: colors.muted },
  split: { alignSelf: 'flex-start', fontSize: font.small, fontWeight: '600', color: colors.primary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  muted: { flex: 1, fontSize: font.small, color: colors.muted },
  total: { fontSize: font.body, fontWeight: '800', color: colors.ink }
});
