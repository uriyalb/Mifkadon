import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react';
import type { Contact, SelectedContact, SwipeSession, Priority } from '../types/contact';
import { useAuth } from './AuthContext';
import { encode, decode, encodeString, decodeString } from '../utils/store';
import {
  computeChapterSizes,
  computeCurrentChapter,
  redistributeChapters,
} from '../config/chapters';

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
  trackingSheetId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  currentChapter: number;
  chapterSizes: number[];
  setSyncState: (status: SyncStatus, error?: string) => void;
  initSession: (contacts: Contact[]) => void;
  restoreSession: (data: RestoreData) => void;
  expandSession: (newContacts: Contact[]) => void;
  swipeRight: (contact: Contact, priority: Priority) => void;
  swipeLeft: (contact: Contact) => void;
  undoSwipe: (contact: Contact, direction: 'right' | 'left') => void;
  addTimeSpent: (seconds: number) => void;
  setSpreadsheetId: (id: string) => void;
  setTrackingSheetId: (id: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SESSION_DATA_KEY = '__sb_data_v1';
export const SPREADSHEET_KEY = '__sb_sid_v1';
export const TRACKING_SHEET_KEY = '__sb_tsid_v1';

// Back-fill chapter data and new tracking fields onto older sessions.
function migrateSession(s: SwipeSession): SwipeSession {
  let migrated = s;
  if (!migrated.chapterSizes || migrated.chapterSizes.length === 0) {
    const chapterSizes = computeChapterSizes(migrated.contacts.length);
    const processed = migrated.selected.length + migrated.dismissed.length;
    const currentChapter = computeCurrentChapter(processed, chapterSizes);
    migrated = { ...migrated, chapterSizes, currentChapter };
  }
  if (migrated.totalSecondsSpent == null) {
    migrated = { ...migrated, totalSecondsSpent: 0 };
  }
  if (migrated.sessionStartSorted == null) {
    migrated = { ...migrated, sessionStartSorted: migrated.selected.length + migrated.dismissed.length };
  }
  return migrated;
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

  const [trackingSheetId, setTrackingSheetIdState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(TRACKING_SHEET_KEY);
      return stored ? decodeString(stored) : null;
    } catch (err) {
      console.warn('[session] Failed to restore tracking sheet ID:', err);
      localStorage.removeItem(TRACKING_SHEET_KEY);
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
      totalSecondsSpent: 0,
      sessionStartSorted: 0,
    };
    persist(s);
  };

  const restoreSession = (data: RestoreData) => {
    if (!user) return;
    const totalContacts = data.allContacts.length;
    const processed = data.selected.length + data.dismissedIds.length;

    // If there's existing progress, lock completed chapters and redistribute
    // remaining contacts. Otherwise compute fresh chapter sizes.
    let chapterSizes: number[];
    let currentChapter: number;
    if (processed > 0 && session?.chapterSizes?.length) {
      currentChapter = session.currentChapter;
      chapterSizes = redistributeChapters(session.chapterSizes, currentChapter, totalContacts);
    } else {
      chapterSizes = computeChapterSizes(totalContacts);
      currentChapter = computeCurrentChapter(processed, chapterSizes);
    }

    const s: SwipeSession = {
      userId: user.id,
      userEmail: user.email,
      contacts: data.pending,
      selected: data.selected,
      dismissed: data.dismissedIds,
      currentIndex: 0,
      chapterSizes,
      currentChapter,
      totalSecondsSpent: session?.totalSecondsSpent ?? 0,
      sessionStartSorted: processed,
    };
    persist(s);
  };

  const expandSession = (newContacts: Contact[]) => {
    if (!session) return;
    const mergedContacts = [...session.contacts, ...newContacts];
    const totalProcessed = session.selected.length + session.dismissed.length;
    const newTotal = totalProcessed + mergedContacts.length;
    const chapterSizes = redistributeChapters(
      session.chapterSizes,
      session.currentChapter,
      newTotal,
    );
    persist({
      ...session,
      contacts: mergedContacts,
      chapterSizes,
      // currentChapter stays the same — user doesn't jump
    });
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

  const addTimeSpent = (seconds: number) => {
    if (!session) return;
    persist({
      ...session,
      totalSecondsSpent: (session.totalSecondsSpent ?? 0) + seconds,
    });
  };

  const setSpreadsheetId = (id: string) => {
    localStorage.setItem(SPREADSHEET_KEY, encodeString(id));
    setSpreadsheetIdState(id);
  };

  const setTrackingSheetId = (id: string) => {
    localStorage.setItem(TRACKING_SHEET_KEY, encodeString(id));
    setTrackingSheetIdState(id);
  };

  const resetSession = () => {
    localStorage.removeItem(SESSION_DATA_KEY);
    localStorage.removeItem(SPREADSHEET_KEY);
    localStorage.removeItem(TRACKING_SHEET_KEY);
    setSession(null);
    setSpreadsheetIdState(null);
    setTrackingSheetIdState(null);
  };

  const currentChapter = session?.currentChapter ?? 0;
  const chapterSizes = session?.chapterSizes ?? [];

  return (
    <SessionContext.Provider
      value={{
        session,
        spreadsheetId,
        trackingSheetId,
        syncStatus,
        syncError,
        currentChapter,
        chapterSizes,
        setSyncState,
        initSession,
        restoreSession,
        expandSession,
        swipeRight,
        swipeLeft,
        undoSwipe,
        addTimeSpent,
        setSpreadsheetId,
        setTrackingSheetId,
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
