import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react';
import type { Contact, SelectedContact, SwipeSession, Priority } from '../types/contact';
import { useAuth } from './AuthContext';
import { encode, decode, encodeString, decodeString } from '../utils/store';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface RestoreData {
  allContacts: Contact[];
  selected: SelectedContact[];
  dismissedIds: string[];
  pending: Contact[];
}

interface SessionContextType {
  session: SwipeSession | null;
  spreadsheetId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  currentChapter: number;
  chapterSizes: number[];
  setSyncState: (status: SyncStatus, error?: string) => void;
  initSession: (contacts: Contact[]) => void;
  restoreSession: (data: RestoreData) => void;
  swipeRight: (contact: Contact, priority: Priority) => void;
  swipeLeft: (contact: Contact) => void;
  undoSwipe: (contact: Contact, direction: 'right' | 'left') => void;
  setSpreadsheetId: (id: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SESSION_DATA_KEY = '__sb_data_v1';
export const SPREADSHEET_KEY = '__sb_sid_v1';

// --- Chapter / difficulty system ---
//
// Contacts are divided into 8 chapters that match the 8 journey legs
// (JOURNEY has 9 cities, so 8 legs between them). Earlier chapters are
// intentionally smaller so the user gets quick wins; later chapters are
// larger and feel more demanding.
//
// The distribution is computed by assigning each chapter a relative weight.
// Weight for chapter i = CHAPTER_WEIGHTS[i]. The number of contacts in a
// chapter is proportional to its weight relative to the total weight sum.
// Minimum 3 contacts per chapter to avoid empty-feeling chapters on small lists.
//
// Example: 50 contacts across 8 chapters (weights sum = 22) →
//   [2, 3, 5, 6, 7, 8, 9, 10] (approximately, last adjusted to hit exact total)
//
// CHAPTER_WEIGHTS must have the same length as NUM_CHAPTERS (= JOURNEY.length - 1).
const CHAPTER_WEIGHTS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]; // sum = 22
const NUM_CHAPTERS = CHAPTER_WEIGHTS.length; // must equal JOURNEY.length - 1

// Divide `total` contacts proportionally across NUM_CHAPTERS using CHAPTER_WEIGHTS.
// The last chapter absorbs any rounding remainder so sizes always sum to `total`.
function computeChapterSizes(total: number): number[] {
  const weightSum = CHAPTER_WEIGHTS.reduce((a, b) => a + b, 0);
  const sizes = CHAPTER_WEIGHTS.map((w) => Math.max(3, Math.round((total * w) / weightSum)));
  // Rounding may leave sizes slightly over or under total — correct in the last slot.
  const diff = total - sizes.reduce((a, b) => a + b, 0);
  sizes[NUM_CHAPTERS - 1] = Math.max(3, sizes[NUM_CHAPTERS - 1] + diff);
  return sizes;
}

// Return the 0-indexed chapter that corresponds to `processed` swipes so far.
// A user enters chapter i once all preceding chapters' contacts are exhausted.
function computeCurrentChapter(processed: number, sizes: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < sizes.length; i++) {
    cumulative += sizes[i];
    if (processed <= cumulative) return i;
  }
  return sizes.length - 1;
}

// Back-fill chapter data onto sessions saved before the chapter system existed.
// Recomputes chapter sizes from the existing contact list and derives the current
// chapter from how many swipes have already been made.
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
    } catch (err) {
      // Corrupted or tampered storage — clear it and start a fresh session.
      console.warn('[session] Failed to restore session data (storage may be corrupted):', err);
      localStorage.removeItem(SESSION_DATA_KEY);
      return null;
    }
  });

  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(SPREADSHEET_KEY);
      return stored ? decodeString(stored) : null;
    } catch (err) {
      console.warn('[session] Failed to restore spreadsheet ID:', err);
      localStorage.removeItem(SPREADSHEET_KEY);
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

  const restoreSession = (data: RestoreData) => {
    if (!user) return;
    const totalContacts = data.allContacts.length;
    const chapterSizes = computeChapterSizes(totalContacts);
    const processed = data.selected.length + data.dismissedIds.length;
    const currentChapter = computeCurrentChapter(processed, chapterSizes);
    const s: SwipeSession = {
      userId: user.id,
      userEmail: user.email,
      contacts: data.pending,
      selected: data.selected,
      dismissed: data.dismissedIds,
      currentIndex: 0,
      chapterSizes,
      currentChapter,
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
        restoreSession,
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
