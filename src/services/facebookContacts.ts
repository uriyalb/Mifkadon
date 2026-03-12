import type { Contact } from '../types/contact';

// Facebook data export format (friends_and_followers/friends.json)
interface FBExportFriend {
  name: string;
  timestamp?: number;
}

interface FBExportFile {
  friends_v2?: FBExportFriend[];
  friends?: FBExportFriend[];
}

export function parseFacebookJson(jsonContent: string): Contact[] {
  let data: FBExportFile | FBExportFriend[];
  try {
    data = JSON.parse(jsonContent);
  } catch {
    throw new Error('קובץ JSON לא תקין. ודא שבחרת את הקובץ הנכון.');
  }

  let friends: FBExportFriend[];
  if (Array.isArray(data)) {
    // Some exports are a raw array
    friends = data;
  } else if (data.friends_v2) {
    friends = data.friends_v2;
  } else if (data.friends) {
    friends = data.friends;
  } else {
    throw new Error('פורמט קובץ לא צפוי. השתמש בקובץ friends.json מהארכיון של פייסבוק.');
  }

  return friends
    .filter((f) => f.name)
    .map((f) => ({
      id: `facebook_${f.name}_${f.timestamp ?? Date.now()}`,
      name: f.name,
      source: 'facebook' as const,
    }));
}

export function readFacebookFile(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contacts = parseFacebookJson(e.target?.result as string);
        if (contacts.length === 0) throw new Error('לא נמצאו חברים בקובץ');
        resolve(contacts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file, 'UTF-8');
  });
}
