import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, shopsAPI, setUnauthorizedHandler } from '../services/api';
import { User, Shop, AuthState } from '../types';

// ─── State & Actions ──────────────────────────────────────────────────────────
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; shop: Shop | null } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_SHOP'; payload: Shop }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: null,
  shop: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        shop: action.payload.shop,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_SHOP':
      return { ...state, shop: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshShop: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  // Register 401 handler so axios interceptor can trigger logout
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await AsyncStorage.multiRemove(['token', 'user']);
      dispatch({ type: 'LOGOUT' });
    });
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await authAPI.getMe();
      const { user, shop } = response.data.data;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, shop },
      });
    } catch {
      // Token invalid or expired — clear storage
      await AsyncStorage.multiRemove(['token', 'user']);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(username, password);
      const { token, user, shop } = response.data.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, shop },
      });
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please try again.';
      throw new Error(msg);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (e) {
      console.warn('AsyncStorage clear error:', e);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshShop = useCallback(async (): Promise<void> => {
    if (!state.user?.shopId) return;
    try {
      const response = await shopsAPI.getById(state.user.shopId);
      dispatch({ type: 'UPDATE_SHOP', payload: response.data.data });
    } catch {
      // silently ignore
    }
  }, [state.user]);

  const updateUser = useCallback((updatedUser: User) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    AsyncStorage.setItem('user', JSON.stringify(updatedUser)).catch(console.error);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshShop, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
