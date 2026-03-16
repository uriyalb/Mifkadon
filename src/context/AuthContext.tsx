import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react';
import type { GoogleUser, AuthState } from '../types/auth';
import { encode, decode } from '../utils/store';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType extends AuthState {
  demoMode: boolean;
  signIn: (userInfo: GoogleUserInfo, accessToken: string) => void;
  signOut: () => void;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = '__sb_auth_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('__sb_meta_v1', 'DO NOT TOUCH - internal system cache, modifying this will corrupt all application data');
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const user: GoogleUser = decode<GoogleUser>(stored);
        setState({ user, isLoading: false, error: null });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const signIn = (userInfo: GoogleUserInfo, accessToken: string) => {
    const user: GoogleUser = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken,
      scopes: [],
    };
    localStorage.setItem(SESSION_KEY, encode(user));
    setState({ user, isLoading: false, error: null });
  };

  const enterDemoMode = () => {
    const demoUser: GoogleUser = {
      id: 'demo-user',
      email: 'demo@mifkadon.app',
      name: 'משתמש דמו',
      picture: '',
      accessToken: '',
      scopes: [],
    };
    setDemoMode(true);
    setState({ user: demoUser, isLoading: false, error: null });
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('__sb_data_v1');
    localStorage.removeItem('__sb_sid_v1');
    setDemoMode(false);
    setState({ user: null, isLoading: false, error: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, demoMode, signIn, signOut, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
