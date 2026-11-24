import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../theme';

// The tab bar sits in the thumb zone and already leaves room for the iPhone home bar.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card },
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.paper }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Finishline',
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: 'AI Fit Advisor',
          tabBarLabel: 'Fit Advisor',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
