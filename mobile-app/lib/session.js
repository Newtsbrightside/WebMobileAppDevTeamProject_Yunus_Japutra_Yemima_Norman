import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The token proves who the user is, so on a phone it is stored ENCRYPTED with
// expo-secure-store (iPhone Keychain / Android Keystore). Other apps cannot read it.
// Plain settings (like the last category) use AsyncStorage instead — see app/(tabs)/index.js.
//
// SecureStore does not exist in a browser, so `npx expo start --web` uses localStorage,
// which is what a web app uses anyway.
const TOKEN_KEY = 'finishline.token';
const USER_KEY = 'finishline.user';

const storage = Platform.OS === 'web'
  ? {
      setItemAsync: async (key, value) => localStorage.setItem(key, value),
      getItemAsync: async key => localStorage.getItem(key),
      deleteItemAsync: async key => localStorage.removeItem(key)
    }
  : SecureStore;

// After login (and when the user's saved sizes change).
export async function saveSession(token, user) {
  await storage.setItemAsync(TOKEN_KEY, token);
  await storage.setItemAsync(USER_KEY, JSON.stringify(user));
}

// When the app starts: still logged in?
export async function loadSession() {
  const token = await storage.getItemAsync(TOKEN_KEY);
  const user = await storage.getItemAsync(USER_KEY);
  return token && user ? { token, user: JSON.parse(user) } : null;
}

// On logout, or when the server answers 401.
export async function clearSession() {
  await storage.deleteItemAsync(TOKEN_KEY);
  await storage.deleteItemAsync(USER_KEY);
}
