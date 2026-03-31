import { ACCESS_CONFIG } from '../config/access';

/**
 * Check if the given email appears in the public allowlist spreadsheet.
 * The sheet must be shared as "Anyone with the link can view".
 *
 * Uses Google's public CSV export endpoint — no OAuth token or API key needed.
 */
export async function isEmailAllowed(
  email: string,
  _accessToken: string,
): Promise<boolean> {
  if (!ACCESS_CONFIG.enabled) return true;

  const url =
    `https://docs.google.com/spreadsheets/d/${ACCESS_CONFIG.allowlistSheetId}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(ACCESS_CONFIG.allowlistTab)}`;

  const resp = await fetch(url);

  if (!resp.ok) {
    // If the sheet is unreachable treat it as "allowed" to avoid locking everyone out
    console.warn('[access] Failed to fetch allowlist, allowing by default:', resp.status);
    return true;
  }

  const csv = await resp.text();
  const normalised = email.trim().toLowerCase();

  // Each row is a quoted CSV value; check if any cell in column A matches the email
  return csv.split('\n').some((line) => {
    const cell = line.split(',')[0].replace(/^"|"$/g, '').trim().toLowerCase();
    return cell === normalised;
  });
}

/** Build a WhatsApp deep-link for requesting access. */
export function buildWhatsAppLink(userEmail: string): string {
  const msg = ACCESS_CONFIG.whatsappMessage.replace('{email}', userEmail);
  return `https://wa.me/${ACCESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
