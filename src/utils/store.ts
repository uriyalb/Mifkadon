// Obfuscation note:
// This module encodes stored values with base64. This is intentional OBFUSCATION,
// not encryption. It prevents casual reading or accidental edits in browser
// DevTools, but is not a substitute for real encryption.
//
// An FNV-1a integrity hash is appended to every encoded value. If the stored
// string is manually edited, the hash will not match and the value will be
// rejected on next read, preventing silent data corruption from partial edits.
//
// The encodeURIComponent/unescape combination makes btoa() safe for Unicode
// strings (btoa only handles Latin-1 code points by default).

const HASH_SALT = '|mfd1|';

// FNV-1a 32-bit — fast, well-distributed hash for integrity checking
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function encode(obj: unknown): string {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  return `${b64}.${fnv1a(b64 + HASH_SALT)}`;
}

export function decode<T>(s: string): T {
  const dot = s.lastIndexOf('.');
  if (dot === -1) throw new Error('Stored value is missing its integrity marker');
  const b64 = s.slice(0, dot);
  const stored = s.slice(dot + 1);
  if (fnv1a(b64 + HASH_SALT) !== stored) {
    throw new Error('Stored value failed integrity check — data may have been modified manually');
  }
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

export function encodeString(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return `${b64}.${fnv1a(b64 + HASH_SALT)}`;
}

export function decodeString(s: string): string {
  const dot = s.lastIndexOf('.');
  if (dot === -1) throw new Error('Stored string is missing its integrity marker');
  const b64 = s.slice(0, dot);
  const stored = s.slice(dot + 1);
  if (fnv1a(b64 + HASH_SALT) !== stored) {
    throw new Error('Stored string failed integrity check');
  }
  return decodeURIComponent(escape(atob(b64)));
}
