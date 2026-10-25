import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('queueless_token'));
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load current user profile on initial mount if token exists
  const fetchCurrentUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('queueless_token');
      if (!storedToken) {
        setUser(null);
        setActiveToken(null);
        setLoading(false);
        return;
      }

      const res = await apiService.getMe();
      if (res.data?.success) {
        setUser(res.data.user);
        setActiveToken(res.data.activeToken || null);
      } else {
        localStorage.removeItem('queueless_token');
        setUser(null);
        setActiveToken(null);
      }
    } catch (err) {
      console.warn('Failed to restore session:', err.message);
      localStorage.removeItem('queueless_token');
      setUser(null);
      setActiveToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login action
  const login = async (email, password) => {
    try {
      const res = await apiService.login({ email, password });
      const { user: userData, token: authToken, message } = res.data;

      localStorage.setItem('queueless_token', authToken);
      setToken(authToken);
      setUser(userData);

      toast.success(message || `Welcome back, ${userData.name}!`);

      // If customer, fetch their active token state
      if (userData.role === 'customer') {
        const activeRes = await apiService.getMyActiveToken();
        if (activeRes.data?.hasActiveToken) {
          setActiveToken(activeRes.data.token);
        } else {
          setActiveToken(null);
        }
      }

      return userData;
    } catch (error) {
      toast.error(error.message || 'Login failed. Please verify your credentials.');
      throw error;
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      const res = await apiService.register({ name, email, password });
      const { user: userData, token: authToken, message } = res.data;

      localStorage.setItem('queueless_token', authToken);
      setToken(authToken);
      setUser(userData);
      setActiveToken(null);

      toast.success(message || 'Account created successfully!');
      return userData;
    } catch (error) {
      toast.error(error.message || 'Registration failed.');
      throw error;
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('queueless_token');
      setUser(null);
      setToken(null);
      setActiveToken(null);
      toast.info('You have been logged out.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeToken,
        setActiveToken,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        isCustomer: user?.role === 'customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
