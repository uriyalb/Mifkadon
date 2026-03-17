export function encode(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export function decode<T>(s: string): T {
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}

export function encodeString(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

export function decodeString(s: string): string {
  return decodeURIComponent(escape(atob(s)));
}
