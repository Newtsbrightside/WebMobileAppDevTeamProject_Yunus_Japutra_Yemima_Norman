import React, { createContext, useState, useContext, useEffect } from 'react';
import { users as initialUsers } from '../data/data';
import { api } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('finish_line_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync role to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('finish_line_role', user.role);
      localStorage.setItem('finish_line_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('finish_line_role');
      localStorage.removeItem('finish_line_user');
      localStorage.removeItem('finish_line_token');
    }
  }, [user]);

  const login = async (username, password) => {
    setError('');
    setLoading(true);

    try {
      // 1. Attempt login via Backend API
      const response = await api.login(username, password);
      if (response && response.token && response.user) {
        localStorage.setItem('finish_line_token', response.token);
        setUser(response.user);
        setLoading(false);
        return true;
      }
    } catch (apiError) {
      // If server specifically returned 401 invalid credentials, report it
      if (apiError.status === 401) {
        setError('Invalid username or password');
        setLoading(false);
        return false;
      }
      console.warn('Backend login unavailable, attempting local fallback:', apiError.message);
    }

    // 2. Fallback to localStorage / hardcoded accounts when backend is unreachable
    let allUsers = [...initialUsers];
    try {
      const registered = JSON.parse(localStorage.getItem('finish_line_registered_users') || '[]');
      if (Array.isArray(registered)) {
        allUsers = [...allUsers, ...registered];
      }
    } catch {
      // ignore JSON parse errors
    }

    const foundUser = allUsers.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      const fallbackUser = {
        id: foundUser.id || (foundUser.role === 'administrator' ? 1 : 2),
        username: foundUser.username,
        role: foundUser.role,
        wallet_balance: foundUser.wallet_balance !== undefined ? foundUser.wallet_balance : (foundUser.role === 'client' ? 500 : 0)
      };
      setUser(fallbackUser);
      setLoading(false);
      return true;
    }

    setError('Invalid username or password');
    setLoading(false);
    return false;
  };

  const register = async (username, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await api.register(username, password);
      if (response && response.token && response.user) {
        localStorage.setItem('finish_line_token', response.token);
        setUser(response.user);
        setLoading(false);
        return true;
      }
    } catch (apiError) {
      if (apiError.status === 409) {
        setError('Username is already taken');
        setLoading(false);
        return false;
      }
      console.warn('Backend register unavailable, creating local session:', apiError.message);
    }

    // Local fallback for offline / static mode
    const fallbackUser = {
      id: Date.now(),
      username: username.trim(),
      password,
      role: 'client',
      wallet_balance: 500
    };

    try {
      const registered = JSON.parse(localStorage.getItem('finish_line_registered_users') || '[]');
      if (registered.some(u => u.username.toLowerCase() === fallbackUser.username.toLowerCase())) {
        setError('Username is already taken');
        setLoading(false);
        return false;
      }
      registered.push(fallbackUser);
      localStorage.setItem('finish_line_registered_users', JSON.stringify(registered));
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }

    setUser(fallbackUser);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setError('');
    localStorage.removeItem('finish_line_token');
    localStorage.removeItem('finish_line_role');
    localStorage.removeItem('finish_line_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
