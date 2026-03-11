import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Fall back to a placeholder so the app renders even without a real client ID.
// The Google login button will fail gracefully; demo mode works without it.
const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'no-client-id';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
