import type { Contact, SelectedContact, Priority } from '../types/contact';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const SPREADSHEET_TITLE_PREFIX = 'מיפקדון';

const PRIORITY_LABEL: Record<string, string> = {
  high: 'ניצחון מהיר',
  medium: 'סיכוי טוב',
  low: 'דרושה עבודה',
};

const LABEL_TO_PRIORITY: Record<string, Priority> = {
  'ניצחון מהיר': 'high',
  'סיכוי טוב': 'medium',
  'דרושה עבודה': 'low',
};

// Tab names (URL-encoded for API calls)
const TAB1 = 'כל אנשי הקשר';
const TAB2 = 'אושרו לקמפיין';
const TAB1_ENC = encodeURIComponent(TAB1);
const TAB2_ENC = encodeURIComponent(TAB2);

// ─── Find existing spreadsheet by title ─────────────────────────────────────
export async function findExistingSpreadsheet(
  accessToken: string,
  userEmail: string
): Promise<string | null> {
  const title = `${SPREADSHEET_TITLE_PREFIX} - ${userEmail}`;
  const query = encodeURIComponent(
    `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  );
  const resp = await fetch(`${DRIVE_API}?q=${query}&fields=files(id,name)&pageSize=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return (data.files?.[0]?.id as string) ?? null;
}

// ─── Create spreadsheet with two tabs ───────────────────────────────────────
export async function createSpreadsheet(
  accessToken: string,
  userEmail: string
): Promise<string> {
  const title = `${SPREADSHEET_TITLE_PREFIX} - ${userEmail}`;
  const resp = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title, locale: 'iw_IL', timeZone: 'Asia/Jerusalem' },
      sheets: [
        { properties: { sheetId: 0, title: TAB1, index: 0 } },
        { properties: { sheetId: 1, title: TAB2, index: 1 } },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to create spreadsheet');
  }
  const data = await resp.json();
  return data.spreadsheetId as string;
}

// ─── Write all contacts to Tab 1 ────────────────────────────────────────────
export async function initContactsTab(
  accessToken: string,
  spreadsheetId: string,
  contacts: Contact[]
): Promise<void> {
  const header = ['מזהה', 'שם', 'טלפון', 'אימייל', 'מקור', 'סטטוס', 'עדיפות', 'עודכן'];
  const rows = contacts.map((c) => [
    c.id, c.name, c.phone ?? '', c.email ?? '', c.source, 'ממתין', '', '',
  ]);

  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${TAB1_ENC}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [header, ...rows] }),
    }
  );

  // Format header row
  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.176, blue: 0.471 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1, rtl: true } },
            fields: 'gridProperties(frozenRowCount,rtl)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 },
          },
        },
      ],
    }),
  }).catch(() => {});
}

// ─── Update a contact's status/priority in Tab 1 (fire-and-forget) ──────────
export function updateContactRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number, // 1-based index of the contact row (row 1 = header → first contact is row 2)
  status: 'אושר' | 'נדחה',
  priority?: string
): Promise<void> {
  const range = `${TAB1_ENC}!F${rowIndex + 1}:H${rowIndex + 1}`;
  const timestamp = new Date().toLocaleString('he-IL');
  return fetch(`${SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [[status, priority ? PRIORITY_LABEL[priority] : '', timestamp]] }),
  }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); });
}

// ─── Load pending contacts from an existing Tab 1 ───────────────────────────
export async function loadPendingContacts(
  accessToken: string,
  spreadsheetId: string
): Promise<Contact[]> {
  const range = `${TAB1_ENC}!A2:H10000`;
  const resp = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  const rows: string[][] = (data.values as string[][]) ?? [];

  // Map with original index BEFORE filtering so sheetRow reflects the real sheet position.
  // Data row i (0-based) = sheet row i+2 (row 1 is header); updateContactRow uses rowIndex
  // where range = F${rowIndex+1}, so sheetRow = i+1 gives the correct rowIndex.
  return rows
    .map((row, i) => ({ row, sheetRow: i + 1 }))
    .filter(({ row }) => row[5] === 'ממתין')
    .map(({ row, sheetRow }) => ({
      id: row[0] ?? '',
      name: row[1] ?? '',
      phone: row[2] || undefined,
      email: row[3] || undefined,
      source: (row[4] ?? 'manual') as Contact['source'],
      sheetRow,
    }));
}

// ─── Load ALL rows from Tab 1 (for dedup check before merge) ────────────────
export async function loadAllContactRows(
  accessToken: string,
  spreadsheetId: string
): Promise<Array<{ id: string; phone?: string; email?: string }>> {
  const range = `${TAB1_ENC}!A2:H10000`;
  const resp = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  const rows: string[][] = (data.values as string[][]) ?? [];
  return rows.map((row) => ({
    id: row[0] ?? '',
    phone: row[2] || undefined,
    email: row[3] || undefined,
  }));
}

// ─── Append new contacts to the end of Tab 1 ─────────────────────────────────
export async function appendContactsToSheet(
  accessToken: string,
  spreadsheetId: string,
  contacts: Contact[]
): Promise<void> {
  if (contacts.length === 0) return;
  const rows = contacts.map((c) => [
    c.id, c.name, c.phone ?? '', c.email ?? '', c.source, 'ממתין', '', '',
  ]);
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${TAB1_ENC}!A:H:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
}

// ─── Rebuild Tab 2 from approved contacts ────────────────────────────────────
export async function syncApprovedTab(
  accessToken: string,
  spreadsheetId: string,
  approved: SelectedContact[]
): Promise<void> {
  // Clear Tab 2
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${TAB2_ENC}!A1:Z1000:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  ).catch(() => {});

  if (approved.length === 0) return;

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...approved].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const header = ['שם', 'טלפון', 'אימייל', 'מקור', 'עדיפות', 'תאריך אישור'];
  const rows = sorted.map((c) => [
    c.name,
    c.phone ?? '',
    c.email ?? '',
    c.source,
    PRIORITY_LABEL[c.priority],
    new Date(c.selectedAt).toLocaleString('he-IL'),
  ]);

  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${TAB2_ENC}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [header, ...rows] }),
    }
  );

  // Format Tab 2
  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.176, blue: 0.471 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 1, gridProperties: { frozenRowCount: 1, rtl: true } },
            fields: 'gridProperties(frozenRowCount,rtl)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 1, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 },
          },
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{ sheetId: 1, startRowIndex: 1, endRowIndex: rows.length + 1 }],
              booleanRule: {
                condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=ISEVEN(ROW())' }] },
                format: { backgroundColor: { red: 1, green: 0.878, blue: 0.937 } },
              },
            },
            index: 0,
          },
        },
      ],
    }),
  }).catch(() => {});
}

// ─── Reset a contact's row back to pending (undo swipe) ──────────────────────
export function clearContactRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number // same 1-based index as updateContactRow
): Promise<void> {
  const range = `${TAB1_ENC}!F${rowIndex + 1}:H${rowIndex + 1}`;
  return fetch(`${SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [['ממתין', '', '']] }),
  }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); });
}

// ─── Load ALL contacts with their status (for session restore) ──────────────
export async function loadAllContactsWithStatus(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  allContacts: Contact[];
  selected: SelectedContact[];
  dismissedIds: string[];
  pending: Contact[];
}> {
  const range = `${TAB1_ENC}!A2:H10000`;
  const resp = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) return { allContacts: [], selected: [], dismissedIds: [], pending: [] };
  const data = await resp.json();
  const rows: string[][] = (data.values as string[][]) ?? [];

  const allContacts: Contact[] = [];
  const selected: SelectedContact[] = [];
  const dismissedIds: string[] = [];
  const pending: Contact[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1; // 1-based, same convention as loadPendingContacts
    const contact: Contact = {
      id: row[0] ?? '',
      name: row[1] ?? '',
      phone: row[2] || undefined,
      email: row[3] || undefined,
      source: (row[4] ?? 'manual') as Contact['source'],
      sheetRow,
    };
    allContacts.push(contact);

    const status = row[5] ?? 'ממתין';
    if (status === 'אושר') {
      const priorityLabel = row[6] ?? '';
      const priority: Priority = LABEL_TO_PRIORITY[priorityLabel] ?? 'medium';
      const timestamp = row[7] ?? '';
      selected.push({
        ...contact,
        priority,
        selectedAt: timestamp || new Date().toISOString(),
      });
    } else if (status === 'נדחה') {
      dismissedIds.push(contact.id);
    } else {
      pending.push(contact);
    }
  }

  return { allContacts, selected, dismissedIds, pending };
}

// ─── Protect progress columns from manual editing ───────────────────────────
export async function protectProgressColumns(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: 0,
                startColumnIndex: 5, // column F (status)
                endColumnIndex: 8,   // through column H (timestamp)
              },
              description: 'נתוני מיון - אל תערוך ידנית',
              warningOnly: true,
            },
          },
        },
        {
          addProtectedRange: {
            protectedRange: {
              range: { sheetId: 1 }, // entire Tab 2
              description: 'טבלת אושרו - נוצרת אוטומטית',
              warningOnly: true,
            },
          },
        },
      ],
    }),
  }).catch(() => {});
}

export function getSpreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export async function checkSheetsAccess(accessToken: string): Promise<boolean> {
  try {
    const resp = await fetch(`${DRIVE_API}?pageSize=1&fields=files(id)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared tracking spreadsheet for group admin
// ═══════════════════════════════════════════════════════════════════════════════

const TRACKING_TITLE_PREFIX = 'רשימת פוטנציאל מפקד';
const TRACKING_TAB1 = 'אנשי קשר מאושרים';
const TRACKING_TAB2 = 'סיכום התקדמות';
const TRACKING_TAB1_ENC = encodeURIComponent(TRACKING_TAB1);
const TRACKING_TAB2_ENC = encodeURIComponent(TRACKING_TAB2);
const ADMIN_EMAIL = 'Mifkad.adomim@gmail.com';

const PRIORITY_TO_NUMBER: Record<string, number> = { high: 1, medium: 2, low: 3 };

const SOURCE_LABEL: Record<string, string> = {
  google: 'ספר טלפונים',
  phone: 'ספר טלפונים',
  facebook: 'פייסבוק',
  instagram: 'אינסטגרם',
  manual: 'ידני',
};

// Debounce: skip sync if less than 2s since last sync
let lastTrackingSyncTs = 0;

// ─── Find existing tracking sheet ────────────────────────────────────────────
export async function findExistingTrackingSheet(
  accessToken: string,
  userEmail: string
): Promise<string | null> {
  const title = `${TRACKING_TITLE_PREFIX} - ${userEmail}`;
  const query = encodeURIComponent(
    `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  );
  const resp = await fetch(`${DRIVE_API}?q=${query}&fields=files(id,name)&pageSize=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return (data.files?.[0]?.id as string) ?? null;
}

// ─── Share spreadsheet with admin ────────────────────────────────────────────
async function shareWithAdmin(accessToken: string, fileId: string): Promise<void> {
  // Try owner transfer first, fall back to writer
  const resp = await fetch(
    `${DRIVE_API}/${fileId}/permissions?transferOwnership=true`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        role: 'owner',
        emailAddress: ADMIN_EMAIL,
      }),
    }
  );
  if (!resp.ok) {
    // Fallback to writer role (owner transfer only works within same Workspace domain)
    await fetch(`${DRIVE_API}/${fileId}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        role: 'writer',
        emailAddress: ADMIN_EMAIL,
      }),
    });
  }
}

// ─── Create tracking sheet with two tabs ─────────────────────────────────────
export async function createTrackingSheet(
  accessToken: string,
  userEmail: string
): Promise<string> {
  const title = `${TRACKING_TITLE_PREFIX} - ${userEmail}`;
  const resp = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title, locale: 'iw_IL', timeZone: 'Asia/Jerusalem' },
      sheets: [
        { properties: { sheetId: 0, title: TRACKING_TAB1, index: 0 } },
        { properties: { sheetId: 1, title: TRACKING_TAB2, index: 1 } },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to create tracking sheet');
  }
  const data = await resp.json();
  const sheetId = data.spreadsheetId as string;

  // Write headers for contacts tab
  const header = [
    'שם',
    'פוטנציאל למפקד (1-3)',
    'מקור (ספר טלפונים, פייסבוק, אינסטגרם...)',
    'מס׳ טלפון',
    'ת. שיחה אחרון',
    'סיכום שיחה',
    'ת. שיחה הבא',
    'התפקד/ה?',
  ];
  await fetch(
    `${SHEETS_API}/${sheetId}/values/${TRACKING_TAB1_ENC}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [header] }),
    }
  );

  // Format both tabs
  await fetch(`${SHEETS_API}/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        // Tab 1 header formatting
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.176, blue: 0.471 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1, rtl: true } },
            fields: 'gridProperties(frozenRowCount,rtl)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 },
          },
        },
        // Tab 2 RTL + frozen header
        {
          updateSheetProperties: {
            properties: { sheetId: 1, gridProperties: { frozenRowCount: 1, rtl: true } },
            fields: 'gridProperties(frozenRowCount,rtl)',
          },
        },
        // Protect columns E-H in Tab 1 (admin-only manual tracking columns are NOT protected)
        // Protect columns A-D (auto-synced from app)
        {
          addProtectedRange: {
            protectedRange: {
              range: { sheetId: 0, startColumnIndex: 0, endColumnIndex: 4 },
              description: 'נתונים אוטומטיים - אל תערוך ידנית',
              warningOnly: true,
            },
          },
        },
      ],
    }),
  }).catch(() => {});

  // Share with admin
  await shareWithAdmin(accessToken, sheetId);

  return sheetId;
}

// ─── Stats for the summary tab ───────────────────────────────────────────────
export interface TrackingStats {
  userName: string;
  userEmail: string;
  totalContacts: number;
  totalSorted: number;
  totalApproved: number;
  totalRejected: number;
  currentChapter: number;
  totalChapters: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalSecondsSpent: number;
  sessionSorted: number;
}

// ─── Sync tracking sheet (debounced, fire-and-forget) ────────────────────────
export function syncTrackingSheet(
  accessToken: string,
  trackingSheetId: string,
  approved: SelectedContact[],
  stats: TrackingStats
): void {
  const now = Date.now();
  if (now - lastTrackingSyncTs < 2000) return;
  lastTrackingSyncTs = now;

  // Fire both syncs in parallel, don't await
  syncTrackingContacts(accessToken, trackingSheetId, approved).catch(() => {});
  syncTrackingSummary(accessToken, trackingSheetId, stats).catch(() => {});
}

// ─── Rebuild contacts tab on tracking sheet ──────────────────────────────────
async function syncTrackingContacts(
  accessToken: string,
  sheetId: string,
  approved: SelectedContact[]
): Promise<void> {
  // Clear data rows (keep header)
  await fetch(
    `${SHEETS_API}/${sheetId}/values/${TRACKING_TAB1_ENC}!A2:H1000:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  ).catch(() => {});

  if (approved.length === 0) return;

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...approved].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const rows = sorted.map((c) => [
    c.name,
    PRIORITY_TO_NUMBER[c.priority] ?? 2,
    SOURCE_LABEL[c.source] ?? c.source,
    c.phone ?? '',
    '', // ת. שיחה אחרון — blank for admin
    '', // סיכום שיחה — blank for admin
    '', // ת. שיחה הבא — blank for admin
    '', // התפקד/ה? — blank for admin
  ]);

  await fetch(
    `${SHEETS_API}/${sheetId}/values/${TRACKING_TAB1_ENC}!A2?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
}

// ─── Update summary tab on tracking sheet ────────────────────────────────────
async function syncTrackingSummary(
  accessToken: string,
  sheetId: string,
  stats: TrackingStats
): Promise<void> {
  const approvalRate = stats.totalSorted > 0
    ? `${Math.round((stats.totalApproved / stats.totalSorted) * 100)}%`
    : '0%';
  const minutesSpent = Math.round(stats.totalSecondsSpent / 60);
  const now = new Date().toLocaleString('he-IL');

  const rows = [
    ['שם המשתמש', stats.userName],
    ['אימייל', stats.userEmail],
    ['', ''],
    ['סה״כ אנשי קשר', stats.totalContacts],
    ['סה״כ מוינו', stats.totalSorted],
    ['סה״כ אושרו', stats.totalApproved],
    ['סה״כ נדחו', stats.totalRejected],
    ['אחוז אישור', approvalRate],
    ['', ''],
    ['פרק נוכחי', `${stats.currentChapter}/${stats.totalChapters}`],
    ['פוטנציאל גבוה (1)', stats.highCount],
    ['פוטנציאל בינוני (2)', stats.mediumCount],
    ['פוטנציאל נמוך (3)', stats.lowCount],
    ['', ''],
    ['זמן כולל (דקות)', minutesSpent],
    ['מוינו בסשן אחרון', stats.sessionSorted],
    ['סשן אחרון', now],
  ];

  await fetch(
    `${SHEETS_API}/${sheetId}/values/${TRACKING_TAB2_ENC}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );

  // Format: bold labels column, auto-resize
  await fetch(`${SHEETS_API}/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId: 1, startColumnIndex: 0, endColumnIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat(textFormat)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 1, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 },
          },
        },
      ],
    }),
  }).catch(() => {});
}
