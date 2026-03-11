import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact } from '../types/contact';
import { fetchGoogleContacts } from '../services/googleContacts';
import { fetchFacebookFriends } from '../services/facebookContacts';
import { readInstagramFile } from '../services/instagramImport';
import {
  findExistingSpreadsheet,
  createSpreadsheet,
  initContactsTab,
  loadPendingContacts,
} from '../services/googleSheets';
import Header from '../components/Header';

interface Props {
  onStart: () => void;
}

type SourceKey = 'google' | 'facebook' | 'instagram' | 'manual';
type Status = 'idle' | 'loading' | 'done' | 'error';

interface SourceState {
  status: Status;
  count: number;
  error?: string;
}

interface ManualContact {
  name: string;
  phone: string;
  email: string;
}

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string;

export default function ImportPage({ onStart }: Props) {
  const { user } = useAuth();
  const { initSession, setSpreadsheetId, resetSession } = useSession();
  const [sources, setSources] = useState<Record<SourceKey, SourceState>>({
    google: { status: 'idle', count: 0 },
    facebook: { status: 'idle', count: 0 },
    instagram: { status: 'idle', count: 0 },
    manual: { status: 'idle', count: 0 },
  });
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [manualForm, setManualForm] = useState<ManualContact>({ name: '', phone: '', email: '' });
  const [showManual, setShowManual] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<{ spreadsheetId: string; pending: number } | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);
  const instagramInputRef = useRef<HTMLInputElement>(null);

  // Check for existing spreadsheet on mount
  useEffect(() => {
    if (!user) return;
    findExistingSpreadsheet(user.accessToken, user.email)
      .then(async (id) => {
        if (id) {
          const pending = await loadPendingContacts(user.accessToken, id);
          if (pending.length > 0) {
            setResumeInfo({ spreadsheetId: id, pending: pending.length });
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingResume(false));
  }, [user]);

  const updateSource = (key: SourceKey, update: Partial<SourceState>) => {
    setSources((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));
  };

  const addContacts = (newContacts: Contact[]) => {
    setAllContacts((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      return [...prev, ...newContacts.filter((c) => !existingIds.has(c.id))];
    });
  };

  const handleGoogle = async () => {
    if (!user) return;
    updateSource('google', { status: 'loading' });
    try {
      const contacts = await fetchGoogleContacts(user.accessToken);
      updateSource('google', { status: 'done', count: contacts.length });
      addContacts(contacts);
    } catch (e) {
      updateSource('google', { status: 'error', error: (e as Error).message });
    }
  };

  const handleFacebook = async () => {
    if (!FB_APP_ID) {
      updateSource('facebook', { status: 'error', error: 'Facebook App ID לא מוגדר' });
      return;
    }
    updateSource('facebook', { status: 'loading' });
    try {
      const contacts = await fetchFacebookFriends(FB_APP_ID);
      updateSource('facebook', { status: 'done', count: contacts.length });
      addContacts(contacts);
    } catch (e) {
      updateSource('facebook', { status: 'error', error: (e as Error).message });
    }
  };

  const handleInstagramFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSource('instagram', { status: 'loading' });
    try {
      const contacts = await readInstagramFile(file);
      updateSource('instagram', { status: 'done', count: contacts.length });
      addContacts(contacts);
    } catch (err) {
      updateSource('instagram', { status: 'error', error: (err as Error).message });
    }
  };

  const handleAddManual = () => {
    if (!manualForm.name.trim()) return;
    const contact: Contact = {
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: manualForm.name.trim(),
      phone: manualForm.phone.trim() || undefined,
      email: manualForm.email.trim() || undefined,
      source: 'manual',
    };
    addContacts([contact]);
    updateSource('manual', { status: 'done', count: sources.manual.count + 1 });
    setManualForm({ name: '', phone: '', email: '' });
  };

  const handleResume = async () => {
    if (!user || !resumeInfo) return;
    setIsStarting(true);
    try {
      const pending = await loadPendingContacts(user.accessToken, resumeInfo.spreadsheetId);
      setSpreadsheetId(resumeInfo.spreadsheetId);
      initSession(pending);
      onStart();
    } catch {
      setIsStarting(false);
    }
  };

  const handleStart = async () => {
    if (!user || allContacts.length === 0) return;
    setIsStarting(true);
    try {
      // Create new spreadsheet and initialize it
      resetSession();
      const sheetId = await createSpreadsheet(user.accessToken, user.email);
      await initContactsTab(user.accessToken, sheetId, allContacts);
      setSpreadsheetId(sheetId);
      initSession(allContacts);
      onStart();
    } catch (e) {
      console.error('Failed to initialize spreadsheet:', e);
      // Start anyway with local session only
      initSession(allContacts);
      onStart();
    }
  };

  const totalContacts = allContacts.length;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">
        {/* Resume banner */}
        <AnimatePresence>
          {!checkingResume && resumeInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-4 mb-4 border-2 border-[#FF2D78]/30"
            >
              <p className="font-bold text-gray-800 text-sm mb-1">
                🔄 נמצאה סשן קיימת!
              </p>
              <p className="text-gray-600 text-xs mb-3">
                נותרו {resumeInfo.pending} אנשי קשר ממיון קודם.
              </p>
              <button
                onClick={handleResume}
                disabled={isStarting}
                className="w-full gradient-pink text-white font-bold py-2 rounded-xl text-sm"
              >
                המשך מהמקום שעצרת
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-white font-bold text-xl mb-4">
          ייבוא אנשי קשר
        </h2>

        {/* Source cards */}
        <div className="space-y-3 mb-6">
          {/* Google */}
          <SourceCard
            icon="🟢"
            title="Google Contacts"
            description="ייבוא כל אנשי הקשר מחשבון Google שלך"
            status={sources.google.status}
            count={sources.google.count}
            error={sources.google.error}
            onAction={handleGoogle}
            actionLabel="ייבא מ-Google"
          />

          {/* Facebook */}
          <SourceCard
            icon="🔵"
            title="Facebook"
            description="ייבוא חברים משותפים מפייסבוק (רק חברים שאישרו את האפליקציה)"
            status={sources.facebook.status}
            count={sources.facebook.count}
            error={sources.facebook.error}
            onAction={handleFacebook}
            actionLabel="התחבר ל-Facebook"
          />

          {/* Instagram */}
          <SourceCard
            icon="🟣"
            title="Instagram"
            description="ייבוא מקובץ ייצוא נתונים של אינסטגרם (followers_1.json)"
            status={sources.instagram.status}
            count={sources.instagram.count}
            error={sources.instagram.error}
            onAction={() => instagramInputRef.current?.click()}
            actionLabel="בחר קובץ"
          >
            <input
              ref={instagramInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleInstagramFile}
            />
            {sources.instagram.status === 'idle' && (
              <details className="text-xs text-gray-500 mt-2">
                <summary className="cursor-pointer text-[#FF2D78]">איך מייצאים נתונים מאינסטגרם?</summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>הגדרות {'>'} פרטיות {'>'} הורד את הנתונים שלך</li>
                  <li>בחר פורמט JSON</li>
                  <li>בחר "עוקבים ועוקבים" ולחץ בקש הורדה</li>
                  <li>כשהקובץ מגיע במייל, פתח את followers_1.json</li>
                </ol>
              </details>
            )}
          </SourceCard>

          {/* Manual */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">הוספה ידנית</h3>
                  {sources.manual.count > 0 && (
                    <p className="text-xs text-gray-500">{sources.manual.count} נוספו</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowManual((v) => !v)}
                className="text-[#FF2D78] text-sm font-bold"
              >
                {showManual ? 'סגור' : '+ הוסף'}
              </button>
            </div>

            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="שם *"
                      value={manualForm.name}
                      onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF2D78]"
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF2D78]"
                    />
                    <input
                      type="email"
                      placeholder="אימייל"
                      value={manualForm.email}
                      onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF2D78]"
                    />
                    <button
                      onClick={handleAddManual}
                      disabled={!manualForm.name.trim()}
                      className="w-full gradient-pink text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                      הוסף איש קשר
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Start button */}
        {totalContacts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass rounded-2xl p-4 mb-4 text-center">
              <p className="text-2xl font-black text-gray-800">{totalContacts}</p>
              <p className="text-gray-500 text-sm">אנשי קשר מוכנים למיון</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              disabled={isStarting}
              className="w-full gradient-pink text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מכין...
                </>
              ) : (
                <>התחל מיון ❤️</>
              )}
            </motion.button>
          </motion.div>
        )}

        {totalContacts === 0 && !checkingResume && (
          <p className="text-white/70 text-center text-sm">
            ייבא לפחות מקור אחד כדי להתחיל
          </p>
        )}
      </div>
    </div>
  );
}

// ─── SourceCard helper component ─────────────────────────────────────────────

interface SourceCardProps {
  icon: string;
  title: string;
  description: string;
  status: Status;
  count: number;
  error?: string;
  onAction: () => void;
  actionLabel: string;
  children?: React.ReactNode;
}

function SourceCard({ icon, title, description, status, count, error, onAction, actionLabel, children }: SourceCardProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
            {status === 'done' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ {count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {children}
        </div>
        <button
          onClick={onAction}
          disabled={status === 'loading' || status === 'done'}
          className={`
            flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all
            ${status === 'done'
              ? 'bg-green-100 text-green-700'
              : status === 'error'
              ? 'gradient-pink text-white'
              : 'gradient-pink text-white'}
            disabled:opacity-60
          `}
        >
          {status === 'loading' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'done' ? (
            '✓'
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </div>
  );
}
