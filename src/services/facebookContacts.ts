import type { Contact } from '../types/contact';

declare global {
  interface Window {
    FB: {
      init: (params: object) => void;
      login: (
        callback: (resp: { authResponse?: { accessToken: string } }) => void,
        opts: object
      ) => void;
      api: (
        path: string,
        params: object,
        callback: (response: { data?: FBFriend[]; error?: { message: string } }) => void
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

interface FBFriend {
  id: string;
  name: string;
  picture?: { data: { url: string } };
}

function loadFBSDK(appId: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/he_IL/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

export async function fetchFacebookFriends(appId: string): Promise<Contact[]> {
  await loadFBSDK(appId);

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        if (!response.authResponse) {
          reject(new Error('ההתחברות לפייסבוק בוטלה'));
          return;
        }
        const token = response.authResponse.accessToken;
        window.FB.api(
          '/me/friends',
          { fields: 'id,name,picture', limit: 1000, access_token: token },
          (data) => {
            if (data.error) {
              reject(new Error(data.error.message));
              return;
            }
            const friends: Contact[] = (data.data ?? []).map((f) => ({
              id: `facebook_${f.id}`,
              name: f.name,
              photoUrl: f.picture?.data.url,
              source: 'facebook' as const,
            }));
            resolve(friends);
          }
        );
      },
      { scope: 'public_profile,user_friends' }
    );
  });
}
