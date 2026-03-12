import type { Contact } from '../types/contact';

/**
 * Parse a .vcf (vCard) file exported from iPhone Contacts or any standard
 * contacts app. Supports vCard 2.1, 3.0 and 4.0.
 *
 * Handles:
 *  - CRLF line endings and line folding (continuation lines)
 *  - Quoted-Printable encoded values (common in vCard 2.1)
 *  - Parameterised property keys (TEL;TYPE=CELL:, EMAIL;TYPE=INTERNET:, etc.)
 *  - Multiple contacts per file
 */
export function parseVCardFile(text: string): Contact[] {
  // 1. Normalise line endings → LF
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Unfold lines: a folded line continuation starts with a single space/tab
  const unfolded = normalised.replace(/\n[ \t]/g, '');

  // 3. Split into individual vCard blocks
  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1);

  const contacts: Contact[] = [];

  for (const block of blocks) {
    const endIdx = block.search(/END:VCARD/i);
    const body = endIdx >= 0 ? block.slice(0, endIdx) : block;

    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

    let name = '';
    let phone = '';
    let email = '';

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;

      // The part before ':' may contain parameters, e.g. "TEL;TYPE=CELL"
      const keyPart = line.slice(0, colonIdx).toUpperCase();
      let value = line.slice(colonIdx + 1).trim();

      // Decode Quoted-Printable if flagged in the key
      if (keyPart.includes('ENCODING=QUOTED-PRINTABLE') || keyPart.includes('QUOTED-PRINTABLE')) {
        value = decodeQuotedPrintable(value);
      }

      // Strip any remaining parameter from keyPart to get the base property name
      const baseProp = keyPart.split(';')[0];

      if (baseProp === 'FN' && value) {
        name = value;
      } else if (baseProp === 'N' && !name && value) {
        // N field: LastName;FirstName;Additional;Prefix;Suffix
        const parts = value.split(';');
        const last = (parts[0] ?? '').trim();
        const first = (parts[1] ?? '').trim();
        name = [first, last].filter(Boolean).join(' ');
      } else if (baseProp === 'TEL' && !phone && value) {
        // Keep only digits, +, spaces, hyphens, parentheses
        const cleaned = value.replace(/[^\d+\-() ]/g, '').trim();
        if (cleaned) phone = cleaned;
      } else if (baseProp === 'EMAIL' && !email && value) {
        email = value;
      }
    }

    if (name.trim()) {
      contacts.push({
        id: `phone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        source: 'phone',
      });
    }
  }

  return contacts;
}

/** Minimal Quoted-Printable decoder (handles =XX hex sequences and soft line breaks) */
function decodeQuotedPrintable(s: string): string {
  return s
    .replace(/=\r?\n/g, '')             // soft line break
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/** Read a File object and return parsed contacts */
export function readVCardFile(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(parseVCardFile(text));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('לא ניתן לקרוא את הקובץ'));
    reader.readAsText(file, 'UTF-8');
  });
}
