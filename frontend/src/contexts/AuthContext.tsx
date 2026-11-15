import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('smartlap_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('smartlap_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    const existingToken = localStorage.getItem('smartlap_token');
    if (!existingToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const user = await authService.getMe();
      setCurrentUser(user);
      localStorage.setItem('smartlap_user', JSON.stringify(user));
    } catch {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('smartlap_token');
      localStorage.removeItem('smartlap_user');
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      setToken(null);
      setCurrentUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchProfile]);

  const login = async (credentials: LoginRequest) => {
    const authData = await authService.login(credentials);
    localStorage.setItem('smartlap_token', authData.token);
    localStorage.setItem('smartlap_user', JSON.stringify(authData.user));
    setToken(authData.token);
    setCurrentUser(authData.user);
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    return await authService.register(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('smartlap_token');
      localStorage.removeItem('smartlap_user');
      setToken(null);
      setCurrentUser(null);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const updated = await authService.updateProfile(data);
    setCurrentUser(updated);
    localStorage.setItem('smartlap_user', JSON.stringify(updated));
    return updated;
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await authService.changePassword(data);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  const isAuthenticated = !!token && !!currentUser;
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
