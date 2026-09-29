import React, { createContext, useState, useContext } from 'react';
import { users } from '../data/data';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const login = (username, password) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('finish_line_role', foundUser.role);
      setError('');
      return true;
    }
    setError('Invalid username or password');
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finish_line_role');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};
