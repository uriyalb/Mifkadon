import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react';
import type { Contact, SelectedContact, SwipeSession, Priority } from '../types/contact';
import { useAuth } from './AuthContext';
import { encode, decode, encodeString, decodeString } from '../utils/store';

export type SyncStatus = 'idle' | 'syncing' | 'error';

interface SessionContextType {
  session: SwipeSession | null;
  spreadsheetId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  currentChapter: number;
  chapterSizes: number[];
  setSyncState: (status: SyncStatus, error?: string) => void;
  initSession: (contacts: Contact[]) => void;
  swipeRight: (contact: Contact, priority: Priority) => void;
  swipeLeft: (contact: Contact) => void;
  undoSwipe: (contact: Contact, direction: 'right' | 'left') => void;
  setSpreadsheetId: (id: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SESSION_DATA_KEY = '__sb_data_v1';
export const SPREADSHEET_KEY = '__sb_sid_v1';

// Increasing weights for 8 chapters: earlier chapters are smaller, later ones larger
const CHAPTER_WEIGHTS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]; // sum = 22
const NUM_CHAPTERS = CHAPTER_WEIGHTS.length;

function computeChapterSizes(total: number): number[] {
  const weightSum = CHAPTER_WEIGHTS.reduce((a, b) => a + b, 0);
  const sizes = CHAPTER_WEIGHTS.map((w) => Math.max(3, Math.round((total * w) / weightSum)));
  // Adjust last element so sizes sum exactly to total
  const diff = total - sizes.reduce((a, b) => a + b, 0);
  sizes[NUM_CHAPTERS - 1] = Math.max(3, sizes[NUM_CHAPTERS - 1] + diff);
  return sizes;
}

function computeCurrentChapter(processed: number, sizes: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < sizes.length; i++) {
    cumulative += sizes[i];
    if (processed <= cumulative) return i;
  }
  return sizes.length - 1;
}

function migrateSession(s: SwipeSession): SwipeSession {
  if (s.chapterSizes && s.chapterSizes.length > 0) return s;
  const chapterSizes = computeChapterSizes(s.contacts.length);
  const processed = s.selected.length + s.dismissed.length;
  const currentChapter = computeCurrentChapter(processed, chapterSizes);
  return { ...s, chapterSizes, currentChapter };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [session, setSession] = useState<SwipeSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_DATA_KEY);
      if (!stored) return null;
      const s = decode<SwipeSession>(stored);
      return migrateSession(s);
    } catch {
      return null;
    }
  });

  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(SPREADSHEET_KEY);
      return stored ? decodeString(stored) : null;
    } catch {
      return null;
    }
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const setSyncState = (status: SyncStatus, error?: string) => {
    setSyncStatus(status);
    setSyncError(error ?? null);
  };

  const persist = (s: SwipeSession) => {
    localStorage.setItem(SESSION_DATA_KEY, encode(s));
    setSession(s);
  };

  const initSession = (contacts: Contact[]) => {
    if (!user) return;
    const chapterSizes = computeChapterSizes(contacts.length);
    const s: SwipeSession = {
      userId: user.id,
      userEmail: user.email,
      contacts,
      selected: [],
      dismissed: [],
      currentIndex: 0,
      chapterSizes,
      currentChapter: 0,
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
    const newSelected = [...session.selected, selected];
    const processed = newSelected.length + session.dismissed.length;
    const currentChapter = computeCurrentChapter(processed, session.chapterSizes);
    persist({
      ...session,
      selected: newSelected,
      currentIndex: session.currentIndex + 1,
      currentChapter,
    });
  };

  const swipeLeft = (contact: Contact) => {
    if (!session) return;
    const newDismissed = [...session.dismissed, contact.id];
    const processed = session.selected.length + newDismissed.length;
    const currentChapter = computeCurrentChapter(processed, session.chapterSizes);
    persist({
      ...session,
      dismissed: newDismissed,
      currentIndex: session.currentIndex + 1,
      currentChapter,
    });
  };

  const undoSwipe = (contact: Contact, direction: 'right' | 'left') => {
    if (!session) return;
    let updated: SwipeSession;
    if (direction === 'right') {
      const newSelected = session.selected.filter((c) => c.id !== contact.id);
      const processed = newSelected.length + session.dismissed.length;
      const currentChapter = computeCurrentChapter(processed, session.chapterSizes);
      updated = {
        ...session,
        selected: newSelected,
        currentIndex: session.currentIndex - 1,
        currentChapter,
      };
    } else {
      const newDismissed = session.dismissed.filter((id) => id !== contact.id);
      const processed = session.selected.length + newDismissed.length;
      const currentChapter = computeCurrentChapter(processed, session.chapterSizes);
      updated = {
        ...session,
        dismissed: newDismissed,
        currentIndex: session.currentIndex - 1,
        currentChapter,
      };
    }
    persist(updated);
  };

  const setSpreadsheetId = (id: string) => {
    localStorage.setItem(SPREADSHEET_KEY, encodeString(id));
    setSpreadsheetIdState(id);
  };

  const resetSession = () => {
    localStorage.removeItem(SESSION_DATA_KEY);
    localStorage.removeItem(SPREADSHEET_KEY);
    setSession(null);
    setSpreadsheetIdState(null);
  };

  const currentChapter = session?.currentChapter ?? 0;
  const chapterSizes = session?.chapterSizes ?? [];

  return (
    <SessionContext.Provider
      value={{
        session,
        spreadsheetId,
        syncStatus,
        syncError,
        currentChapter,
        chapterSizes,
        setSyncState,
        initSession,
        swipeRight,
        swipeLeft,
        undoSwipe,
        setSpreadsheetId,
        resetSession,
      }}
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
