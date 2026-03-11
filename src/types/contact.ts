export type ContactSource = 'google' | 'facebook' | 'instagram' | 'manual';

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
}

export interface SelectedContact extends Contact {
  priority: Priority;
  selectedAt: string; // ISO date string
}

export interface SwipeSession {
  userId: string;
  userEmail: string;
  contacts: Contact[];
  selected: SelectedContact[];
  dismissed: string[]; // contact IDs
  currentIndex: number;
}
