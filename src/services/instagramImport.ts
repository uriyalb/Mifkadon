import type { Contact } from '../types/contact';

interface InstagramEntry {
  string_list_data: Array<{ value: string; timestamp?: number; href?: string }>;
  title?: string;
}

export function parseInstagramJson(jsonContent: string): Contact[] {
  let data: InstagramEntry[];
  try {
    data = JSON.parse(jsonContent);
  } catch {
    throw new Error('קובץ JSON לא תקין. ודא שבחרת את הקובץ הנכון.');
  }

  if (!Array.isArray(data)) {
    throw new Error('פורמט קובץ לא צפוי. השתמש בקובץ followers_1.json.');
  }

  const contacts: Contact[] = [];
  for (const item of data) {
    const entry = item.string_list_data?.[0];
    if (!entry?.value) continue;
    contacts.push({
      id: `instagram_${entry.value}_${entry.timestamp ?? Date.now()}`,
      name: entry.value,
      source: 'instagram',
    });
  }
  return contacts;
}

export function readInstagramFile(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contacts = parseInstagramJson(e.target?.result as string);
        resolve(contacts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file, 'UTF-8');
  });
}
