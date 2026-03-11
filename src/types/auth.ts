export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  scopes: string[];
}

export interface AuthState {
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
}
