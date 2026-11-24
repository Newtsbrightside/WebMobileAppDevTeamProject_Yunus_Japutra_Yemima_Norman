import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { users as offlineUsers } from '../data/data';
import { api, API_ENABLED, getToken, setToken } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'finish_line_user';

// Offline demo only (a build without VITE_API_URL): fake accounts from data.js.
// With an API, every login is checked by the server.
const offlineLogin = (username, password) => {
  const found = offlineUsers.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!found) return null;
  return {
    id: found.role === 'administrator' ? 1 : 2,
    username: found.username,
    role: found.role,
    wallet_balance: found.role === 'client' ? 500 : 0,
    left_size: null,
    right_size: null
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      // With an API, a saved user without a token is not logged in.
      return saved && (!API_ENABLED || getToken()) ? saved : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // The user object is not a secret (the token is), so it may live in localStorage.
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError('');
    localStorage.removeItem('finish_line_role');
  }, []);

  // Any request that answers 401 fires this event (see api.js).
  useEffect(() => {
    const onExpired = () => {
      logout();
      setError('Your session has expired. Please log in again.');
    };
    window.addEventListener('finishline:session-expired', onExpired);
    return () => window.removeEventListener('finishline:session-expired', onExpired);
  }, [logout]);

  // On page load, refresh the saved user from the server (an expired token logs out here).
  useEffect(() => {
    if (API_ENABLED && getToken()) {
      api.getMe().then(({ user: fresh }) => setUser(fresh)).catch(() => {});
    }
  }, []);

  const startSession = (token, newUser) => {
    setToken(token);
    setUser(newUser);
  };

  const login = async (username, password) => {
    setError('');
    setLoading(true);
    try {
      if (!API_ENABLED) {
        const offline = offlineLogin(username, password);
        if (!offline) throw Object.assign(new Error('Invalid username or password'), { status: 401 });
        setUser(offline);
        return true;
      }
      const response = await api.login(username, password);
      startSession(response.token, response.user);
      return true;
    } catch (err) {
      setError(err.status === 401 ? 'Invalid username or password' : err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.register(username, password);
      startSession(response.token, response.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Save the size of each foot on the server, so the phone app sees it too.
  const saveSizes = async (leftSize, rightSize) => {
    if (!API_ENABLED) {
      setUser(current => ({ ...current, left_size: leftSize, right_size: rightSize }));
      return;
    }
    const response = await api.saveMySizes(leftSize, rightSize);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, saveSizes, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
