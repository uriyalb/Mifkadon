import type { Contact } from '../types/contact';

interface GooglePerson {
  resourceName: string;
  names?: Array<{ displayName: string }>;
  emailAddresses?: Array<{ value: string }>;
  phoneNumbers?: Array<{ value: string }>;
  photos?: Array<{ url: string }>;
  organizations?: Array<{ name: string; title?: string }>;
}

export async function fetchGoogleContacts(accessToken: string): Promise<Contact[]> {
  const params = new URLSearchParams({
    personFields: 'names,emailAddresses,phoneNumbers,photos,organizations',
    pageSize: '1000',
  });

  const contacts: Contact[] = [];
  let nextPageToken: string | undefined;

  do {
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const resp = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Google Contacts API error: ${resp.status}`);
    }

    const data = await resp.json();
    nextPageToken = data.nextPageToken;

    const people: GooglePerson[] = data.connections || [];
    for (const person of people) {
      const name = person.names?.[0]?.displayName;
      if (!name) continue;

      contacts.push({
        id: `google_${person.resourceName}`,
        name,
        email: person.emailAddresses?.[0]?.value,
        phone: person.phoneNumbers?.[0]?.value,
        photoUrl: person.photos?.[0]?.url,
        organizationName: person.organizations?.[0]?.name,
        jobTitle: person.organizations?.[0]?.title,
        source: 'google',
      });
    }
  } while (nextPageToken);

  return contacts;
}
