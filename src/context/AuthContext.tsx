import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react';
import type { GoogleUser, AuthState } from '../types/auth';

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

const SESSION_KEY = 'mifkadon_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const user: GoogleUser = JSON.parse(stored);
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
    // sessionStorage only — clears when tab/browser closes
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
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
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('mifkadon_session_data');
    sessionStorage.removeItem('mifkadon_spreadsheet_id');
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
