/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { auth } from '../auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => auth.getUser());

  const login = async (username, password) => {
    const result = await auth.login(username, password);
    if (result.success) {
      setUser(auth.getUser());
    }
    return result;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  useEffect(() => {
    // Clear any previous theme classes
    document.body.classList.remove('theme-admin', 'theme-faculty', 'theme-student');
    
    // Apply current role theme
    if (user?.role) {
      document.body.classList.add(`theme-${user.role}`);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isFaculty: user?.role === 'faculty',
      isStudent: user?.role === 'student',
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
