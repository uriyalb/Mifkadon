export type ContactSource = 'google' | 'facebook' | 'instagram' | 'manual' | 'phone';

export type Priority = 'high' | 'medium' | 'low';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  source: ContactSource;
  notes?: string;
  organizationName?: string;
  jobTitle?: string;
  /** 1-based row index in the Google Sheet (set when loading from sheet) */
  sheetRow?: number;
}

export interface SelectedContact extends Contact {
  priority: Priority;
  selectedAt: string; // ISO date string
}

/** Manager-filled tracking data from the shared tracking spreadsheet (columns E-H) */
export interface ContactTrackingData {
  lastCallDate: string;
  callSummary: string;
  nextCallDate: string;
  registered: string;
}

export interface ChapterStats {
  kept: number;
  skipped: number;
  priorityBreakdown: Record<Priority, number>;
  secondsElapsed: number;
}

export interface SwipeSession {
  userId: string;
  userEmail: string;
  contacts: Contact[];
  selected: SelectedContact[];
  dismissed: string[]; // contact IDs
  currentIndex: number;
  chapterSizes: number[];   // contacts per chapter (8 chapters, increasing size)
  currentChapter: number;   // 0-indexed chapter the user is currently in
  totalSecondsSpent: number;    // cumulative seconds spent swiping across all chapters
  sessionStartSorted: number;   // contacts sorted when this browser session began
}
