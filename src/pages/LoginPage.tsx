import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { mockContacts } from '../data/mockContacts';
import { LOGIN_TEXT } from '../config/textLogin';
import { isEmailAllowed, buildWhatsAppLink } from '../services/accessCheck';

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
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);

  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      setDeniedEmail(null);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then((r) => r.json());

        // Check allowlist before signing in
        const allowed = await isEmailAllowed(userInfo.email, response.access_token);
        if (!allowed) {
          // Revoke the token so it can't be reused
          fetch(`https://oauth2.googleapis.com/revoke?token=${response.access_token}`, {
            method: 'POST',
          }).catch(() => {});
          setDeniedEmail(userInfo.email);
          setIsLoading(false);
          return;
        }

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

  // ── Access denied screen ──────────────────────────────────────────────────
  if (deniedEmail) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-6" dir="rtl" style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/20 mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🔒</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-3 drop-shadow-lg">
            {LOGIN_TEXT.accessDenied.title}
          </h1>
          <p className="text-white/80 text-sm mb-2 leading-relaxed whitespace-pre-line">
            {LOGIN_TEXT.accessDenied.message}
          </p>
          <p className="text-white/50 text-xs mb-8" dir="ltr">{deniedEmail}</p>

          <a
            href={buildWhatsAppLink(deniedEmail)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-base transition-all hover:brightness-110 active:scale-95 mb-3"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {LOGIN_TEXT.accessDenied.whatsappButton}
          </a>

          <button
            onClick={() => setDeniedEmail(null)}
            className="w-full glass text-gray-700 font-bold py-3 px-6 rounded-2xl text-sm transition-all hover:bg-white/30 active:scale-95"
          >
            {LOGIN_TEXT.accessDenied.backButton}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Normal login screen ───────────────────────────────────────────────────
  return (
    <div
      className="h-[100dvh] flex flex-col items-center justify-center p-6 overflow-hidden"
      dir="rtl"
      style={{ background: 'linear-gradient(160deg, #B71C1C 0%, #E53935 30%, #EF5350 60%, #FFCDD2 85%, #FFF5F5 100%)' }}
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #FF6BA8, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #FFD700, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm text-center relative z-10"
      >
        {/* Ilan character sprite — large, centered hero image */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-4 relative"
          style={{ width: 120, height: 135 }}
        >
          {/* Glow behind sprite */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-50"
            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6), transparent)', transform: 'scale(1.5)' }}
          />
          <div
            style={{
              width: 120,
              height: 135,
              backgroundImage: 'url(/Ilan_sprite.png)',
              backgroundSize: '400% 300%',
              backgroundPosition: '0% 0%',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 8px 20px rgba(255, 107, 53, 0.5))',
              animation: 'ilan-ride-sprite 2s linear infinite',
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-5xl font-black text-white mb-1 drop-shadow-lg tracking-tight"
        >
          {LOGIN_TEXT.title}
        </motion.h1>

        {/* Tagline — key phrase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="inline-block mb-2"
        >
          <span
            className="text-lg font-black px-4 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FF6B35)',
              color: '#7B1C1C',
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.35)',
            }}
          >
            {LOGIN_TEXT.tagline}
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-white/90 text-base mb-2 font-medium"
        >
          {LOGIN_TEXT.subtitle}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-white/70 text-sm mb-6 leading-relaxed whitespace-pre-line"
        >
          {LOGIN_TEXT.description}
        </motion.p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Google login button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setIsLoading(true);
            setError(null);
            try { login(); } catch { setError(LOGIN_TEXT.errors.popupFailed); setIsLoading(false); }
          }}
          disabled={isLoading}
          className="w-full bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-base disabled:opacity-60 transition-all"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
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
          <div className="flex-1 h-px bg-white/25" />
          <span className="text-white/40 text-xs">{LOGIN_TEXT.or}</span>
          <div className="flex-1 h-px bg-white/25" />
        </div>

        {/* Demo button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { enterDemoMode(); onLogin(); }}
          className="w-full glass text-gray-700 font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm"
        >
          {LOGIN_TEXT.demoButton(mockContacts.length)}
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/40 text-xs mt-4 leading-relaxed whitespace-pre-line"
        >
          {LOGIN_TEXT.disclaimer}
        </motion.p>
      </motion.div>
    </div>
  );
}
