import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';
import { colors } from '../theme';

// Expo Router's outer file: every screen in app/ is shown inside it.
// <AuthProvider> wraps the Stack, so every screen can call useAuth().
// Stack screens get the system back gesture (iPhone) and back button (Android) for free.
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.paper }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="shoe/[id]" options={{ title: 'Shoe' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Place order' }} />
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
      </Stack>
    </AuthProvider>
  );
}
