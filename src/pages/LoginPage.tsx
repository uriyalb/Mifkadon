import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { mockContacts } from '../data/mockContacts';
import { LOGIN_TEXT } from '../config/textLogin';

interface Props {
  onLogin: () => void;
}

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

export default function LoginPage({ onLogin }: Props) {
  const { signIn, enterDemoMode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then((r) => r.json());

        signIn(
          { sub: userInfo.sub, email: userInfo.email, name: userInfo.name, picture: userInfo.picture },
          response.access_token
        );
        onLogin();
      } catch {
        setError(LOGIN_TEXT.errors.generic);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError(LOGIN_TEXT.errors.failed);
      setIsLoading(false);
    },
    onNonOAuthError: () => {
      setError(LOGIN_TEXT.errors.blocked);
      setIsLoading(false);
    },
  });

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center p-6" dir="rtl" style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl gradient-pink mx-auto mb-6 flex items-center justify-center shadow-2xl"
        >
          <span className="text-5xl font-black text-white">{LOGIN_TEXT.logo}</span>
        </motion.div>

        <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{LOGIN_TEXT.title}</h1>
        <p className="text-white/90 text-lg mb-2 font-medium">{LOGIN_TEXT.subtitle}</p>
        <p className="text-white/70 text-sm mb-10 leading-relaxed whitespace-pre-line">
          {LOGIN_TEXT.description}
        </p>

        {/* Features */}
        <div className="glass rounded-2xl p-4 mb-6 text-right space-y-2.5">
          {LOGIN_TEXT.features.map((text) => (
            <div key={text} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setIsLoading(true);
            setError(null);
            try { login(); } catch { setError(LOGIN_TEXT.errors.popupFailed); setIsLoading(false); }
          }}
          disabled={isLoading}
          className="w-full bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-base disabled:opacity-60 transition-all"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoading ? LOGIN_TEXT.loginButtonLoading : LOGIN_TEXT.loginButton}
        </motion.button>

        <div className="relative my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/40 text-xs">{LOGIN_TEXT.or}</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { enterDemoMode(); onLogin(); }}
          className="w-full glass text-gray-700 font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm"
        >
          {LOGIN_TEXT.demoButton(mockContacts.length)}
        </motion.button>

        <p className="text-white/50 text-xs mt-4 leading-relaxed whitespace-pre-line">
          {LOGIN_TEXT.disclaimer}
        </p>
      </motion.div>
    </div>
  );
}
