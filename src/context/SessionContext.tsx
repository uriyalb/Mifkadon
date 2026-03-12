import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react';
import type { Contact, SelectedContact, SwipeSession, Priority } from '../types/contact';
import { useAuth } from './AuthContext';

interface SessionContextType {
  session: SwipeSession | null;
  spreadsheetId: string | null;
  initSession: (contacts: Contact[]) => void;
  swipeRight: (contact: Contact, priority: Priority) => void;
  swipeLeft: (contact: Contact) => void;
  undoSwipe: (contact: Contact, direction: 'right' | 'left') => void;
  setSpreadsheetId: (id: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const SESSION_DATA_KEY = 'mifkadon_session_data';
const SPREADSHEET_KEY = 'mifkadon_spreadsheet_id';

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [session, setSession] = useState<SwipeSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    return sessionStorage.getItem(SPREADSHEET_KEY);
  });

  const persist = (s: SwipeSession) => {
    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(s));
    setSession(s);
  };

  const initSession = (contacts: Contact[]) => {
    if (!user) return;
    const s: SwipeSession = {
      userId: user.id,
      userEmail: user.email,
      contacts,
      selected: [],
      dismissed: [],
      currentIndex: 0,
    };
    persist(s);
  };

  const swipeRight = (contact: Contact, priority: Priority) => {
    if (!session) return;
    const selected: SelectedContact = {
      ...contact,
      priority,
      selectedAt: new Date().toISOString(),
    };
    persist({
      ...session,
      selected: [...session.selected, selected],
      currentIndex: session.currentIndex + 1,
    });
  };

  const swipeLeft = (contact: Contact) => {
    if (!session) return;
    persist({
      ...session,
      dismissed: [...session.dismissed, contact.id],
      currentIndex: session.currentIndex + 1,
    });
  };

  const undoSwipe = (contact: Contact, direction: 'right' | 'left') => {
    if (!session) return;
    if (direction === 'right') {
      persist({
        ...session,
        selected: session.selected.filter((c) => c.id !== contact.id),
        currentIndex: session.currentIndex - 1,
      });
    } else {
      persist({
        ...session,
        dismissed: session.dismissed.filter((id) => id !== contact.id),
        currentIndex: session.currentIndex - 1,
      });
    }
  };

  const setSpreadsheetId = (id: string) => {
    sessionStorage.setItem(SPREADSHEET_KEY, id);
    setSpreadsheetIdState(id);
  };

  const resetSession = () => {
    sessionStorage.removeItem(SESSION_DATA_KEY);
    sessionStorage.removeItem(SPREADSHEET_KEY);
    setSession(null);
    setSpreadsheetIdState(null);
  };

  return (
    <SessionContext.Provider
      value={{ session, spreadsheetId, initSession, swipeRight, swipeLeft, undoSwipe, setSpreadsheetId, resetSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
