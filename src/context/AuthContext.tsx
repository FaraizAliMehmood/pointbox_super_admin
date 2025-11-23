import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('super_admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          role: 'super_admin',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setUser(userData);
        localStorage.setItem('super_admin_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: response.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.signup(username, email, password);
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          role: 'super_admin',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setUser(userData);
        localStorage.setItem('super_admin_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: response.message || 'Signup failed' };
    } catch (error: any) {
      console.error('Signup error:', error);
      // Extract user-friendly error message
      const errorMessage = error.message || 'An error occurred during signup';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('super_admin_user');
    apiService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

