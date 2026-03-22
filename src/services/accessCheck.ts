import { ACCESS_CONFIG } from '../config/access';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Check if the given email appears in the public allowlist spreadsheet.
 * The sheet must be shared as "Anyone with the link can view" so we can
 * read it with an API key–free call via the public export endpoint.
 *
 * Uses the Sheets v4 REST API with the user's access token (already granted
 * after OAuth) — no extra API key needed.
 */
export async function isEmailAllowed(
  email: string,
  accessToken: string,
): Promise<boolean> {
  const tab = encodeURIComponent(ACCESS_CONFIG.allowlistTab);
  const range = `${tab}!A:A`;
  const url = `${SHEETS_API}/${ACCESS_CONFIG.allowlistSheetId}/values/${range}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    // If the sheet is unreachable treat it as "allowed" to avoid locking everyone out
    console.warn('[access] Failed to fetch allowlist, allowing by default:', resp.status);
    return true;
  }

  const data = await resp.json();
  const rows: string[][] = (data.values as string[][]) ?? [];
  const normalised = email.trim().toLowerCase();

  return rows.some((row) => (row[0] ?? '').trim().toLowerCase() === normalised);
}

/** Build a WhatsApp deep-link for requesting access. */
export function buildWhatsAppLink(userEmail: string): string {
  const msg = ACCESS_CONFIG.whatsappMessage.replace('{email}', userEmail);
  return `https://wa.me/${ACCESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
