import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { clearSession, loadSession, saveSession } from './session';

// "Who is logged in?" is shared by every screen. app/_layout.js wraps the whole app in
// <AuthProvider>, and each screen reads what it needs with useAuth().
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // true until the saved session is read, so a logged-in user never sees the login form flash
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    loadSession()
      .then(session => {
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      })
      .catch(() => {})
      .finally(() => setIsRestoring(false));
  }, []);

  // useCallback keeps these functions the same between renders, so screens can use
  // them inside effects without starting the effect again on every render.
  const signIn = useCallback(async (newToken, newUser) => {
    await saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // The server sent a newer copy of the user (e.g. after saving shoe sizes).
  const updateUser = useCallback(async newUser => {
    await saveSession(token, newUser);
    setUser(newUser);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, isRestoring, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Every screen that sends the token handles a 401 the same way: forget the token,
// open the login screen, and come back to `next` after logging in again.
export function useSessionExpired() {
  const { signOut } = useAuth();
  const router = useRouter();
  return useCallback(async next => {
    await signOut();
    router.replace({ pathname: '/login', params: { next, expired: '1' } });
  }, [signOut, router]);
}
