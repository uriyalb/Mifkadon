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

// Envelope stored in localStorage so we can track how old the session is.
// Google OAuth access tokens expire after ~1 hour; we clear ours at the same threshold.
interface StoredSession {
  user: GoogleUser;
  storedAt: number; // Unix ms timestamp of when the token was saved
}

const SESSION_KEY = '__sb_auth_v1';
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour — mirrors Google access-token lifetime

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    // Write the DO NOT TOUCH warning key once so a curious user opening DevTools
    // sees it before touching the data keys.
    localStorage.setItem(
      '__sb_meta_v1',
      'DO NOT TOUCH - internal system cache, modifying this will corrupt all application data'
    );

    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const { user, storedAt } = decode<StoredSession>(stored);
        const ageMs = Date.now() - storedAt;
        if (ageMs > SESSION_MAX_AGE_MS) {
          // Token is older than one hour — treat as expired and force re-login.
          localStorage.removeItem(SESSION_KEY);
          setState((s) => ({ ...s, isLoading: false }));
        } else {
          setState({ user, isLoading: false, error: null });
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch (err) {
      // Corrupted or tampered storage — clear it and start fresh.
      console.warn('[auth] Failed to restore session (storage may be corrupted):', err);
      localStorage.removeItem(SESSION_KEY);
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
    const envelope: StoredSession = { user, storedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, encode(envelope));
    setState({ user, isLoading: false, error: null });
  };

  const enterDemoMode = () => {
    // Demo mode never writes to localStorage — no need to persist a fake token.
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
