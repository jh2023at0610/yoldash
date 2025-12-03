import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setBalance(data.user.tokenBalance || 0);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setBalance(data.user.tokenBalance || 0);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email, phone, password, name, lastname) => {
    try {
      console.log('Sending register request to:', 'http://localhost:3001/api/auth/register');
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password, name, lastname })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setBalance(data.user.tokenBalance || 20);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setBalance(0);
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/balance`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        return data.balance;
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
    return balance;
  };

  const updateBalance = (newBalance) => {
    setBalance(newBalance);
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      getAuthHeaders, 
      isAuthenticated: !!user,
      balance,
      fetchBalance,
      updateBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

