import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact } from '../types/contact';
import { fetchGoogleContacts } from '../services/googleContacts';
import { fetchFacebookFriends } from '../services/facebookContacts';
import { readInstagramFile } from '../services/instagramImport';
import { readVCardFile } from '../services/vcardImport';
import {
  findExistingSpreadsheet,
  createSpreadsheet,
  initContactsTab,
  loadPendingContacts,
  loadAllContactRows,
  appendContactsToSheet,
} from '../services/googleSheets';
import Header from '../components/Header';

interface Props {
  onStart: () => void;
}

type SourceKey = 'google' | 'facebook' | 'instagram' | 'phone' | 'manual';
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

function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (d.startsWith('972')) return d.slice(3);
  if (d.startsWith('0')) return d.slice(1);
  return d;
}

// Colour dot per source (no emojis)
const SOURCE_COLOR: Record<SourceKey, string> = {
  google: 'bg-green-400',
  facebook: 'bg-blue-500',
  instagram: 'bg-purple-500',
  phone: 'bg-teal-400',
  manual: 'bg-gray-400',
};

export default function ImportPage({ onStart }: Props) {
  const { user } = useAuth();
  const { initSession, setSpreadsheetId, resetSession } = useSession();

  const [sources, setSources] = useState<Record<SourceKey, SourceState>>({
    google:    { status: 'idle', count: 0 },
    facebook:  { status: 'idle', count: 0 },
    instagram: { status: 'idle', count: 0 },
    phone:     { status: 'idle', count: 0 },
    manual:    { status: 'idle', count: 0 },
  });
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  // Save-to-Sheets state
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null); // null = not saved yet
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [manualForm, setManualForm] = useState<ManualContact>({ name: '', phone: '', email: '' });
  const [showManual, setShowManual] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<{ spreadsheetId: string; pending: number } | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);

  const instagramInputRef = useRef<HTMLInputElement>(null);
  const vcardInputRef = useRef<HTMLInputElement>(null);

  // Check for an existing spreadsheet to offer resume
  useEffect(() => {
    if (!user) { setCheckingResume(false); return; }
    findExistingSpreadsheet(user.accessToken, user.email)
      .then(async (id) => {
        if (id) {
          const pending = await loadPendingContacts(user.accessToken, id);
          if (pending.length > 0) setResumeInfo({ spreadsheetId: id, pending: pending.length });
        }
      })
      .catch(() => {})
      .finally(() => setCheckingResume(false));
  }, [user]);

  const updateSource = (key: SourceKey, update: Partial<SourceState>) =>
    setSources((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));

  const addContacts = (newContacts: Contact[]) => {
    setAllContacts((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      const phones = new Set(prev.filter((c) => c.phone).map((c) => normalizePhone(c.phone!)));
      const emails = new Set(prev.filter((c) => c.email).map((c) => c.email!.toLowerCase()));
      return [
        ...prev,
        ...newContacts.filter(
          (c) =>
            !ids.has(c.id) &&
            !(c.phone && phones.has(normalizePhone(c.phone))) &&
            !(c.email && emails.has(c.email.toLowerCase()))
        ),
      ];
    });
    setSavedCount(null);
    setSaveError(null);
  };

  // ── Source handlers ───────────────────────────────────────────────────────

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

  const handleVCardFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSource('phone', { status: 'loading' });
    try {
      const contacts = await readVCardFile(file);
      if (contacts.length === 0) throw new Error('לא נמצאו אנשי קשר בקובץ');
      updateSource('phone', { status: 'done', count: contacts.length });
      addContacts(contacts);
    } catch (err) {
      updateSource('phone', { status: 'error', error: (err as Error).message });
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

  // ── Resume ────────────────────────────────────────────────────────────────

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

  // ── Save to Sheets (separate from Start) ──────────────────────────────────

  const handleSave = async () => {
    if (!user || allContacts.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const existingId = await findExistingSpreadsheet(user.accessToken, user.email);
      if (existingId) {
        // Merge: append only contacts not already in the sheet
        const existingRows = await loadAllContactRows(user.accessToken, existingId);
        const existingIds = new Set(existingRows.map((r) => r.id));
        const existingPhones = new Set(
          existingRows.filter((r) => r.phone).map((r) => normalizePhone(r.phone!))
        );
        const existingEmails = new Set(
          existingRows.filter((r) => r.email).map((r) => r.email!.toLowerCase())
        );
        const toAppend = allContacts.filter(
          (c) =>
            !existingIds.has(c.id) &&
            !(c.phone && existingPhones.has(normalizePhone(c.phone))) &&
            !(c.email && existingEmails.has(c.email.toLowerCase()))
        );
        if (toAppend.length > 0) {
          await appendContactsToSheet(user.accessToken, existingId, toAppend);
        }
        // Reload full pending list so session includes existing + new
        const allPending = await loadPendingContacts(user.accessToken, existingId);
        setAllContacts(allPending);
        resetSession();
        setSpreadsheetId(existingId);
        setSavedCount(allPending.length);
      } else {
        const sheetId = await createSpreadsheet(user.accessToken, user.email);
        await initContactsTab(user.accessToken, sheetId, allContacts);
        resetSession();
        setSpreadsheetId(sheetId);
        setSavedCount(allContacts.length);
      }
    } catch (e) {
      const msg = (e as Error).message ?? '';
      if (msg.includes('has not been used') || msg.includes('is disabled') || msg.includes('SERVICE_DISABLED')) {
        setSaveError('ה-API של Google Sheets או Drive אינו מופעל בפרויקט Google Cloud שלך. עקוב אחר ההוראות למטה.');
      } else if (msg.includes('insufficient') || msg.includes('PERMISSION_DENIED')) {
        setSaveError('חסרות הרשאות. התנתק והתחבר מחדש כדי לאשר את הגישה ל-Google Sheets ו-Drive.');
      } else {
        setSaveError(msg || 'שגיאה בשמירה ל-Google Sheets. נסה שוב.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Start sorting ─────────────────────────────────────────────────────────

  const handleStart = () => {
    if (allContacts.length === 0) return;
    setIsStarting(true);
    initSession(allContacts);
    onStart();
  };

  const totalContacts = allContacts.length;
  const isSaved = savedCount !== null;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">

        {/* Resume banner */}
        <AnimatePresence>
          {!checkingResume && resumeInfo && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-4 mb-4 border-2 border-[#FF2D78]/30"
            >
              <p className="font-bold text-gray-800 text-sm mb-0.5">נמצא סשן קיים</p>
              <p className="text-gray-500 text-xs mb-3">
                נותרו {resumeInfo.pending} אנשי קשר ממיון קודם — ממשיך מהמקום שעצרת.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleResume}
                disabled={isStarting}
                className="w-full gradient-pink text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60"
              >
                המשך מהמקום שעצרת
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-white font-bold text-xl mb-4">ייבוא אנשי קשר</h2>

        {/* Source cards */}
        <div className="space-y-3 mb-6">

          {/* Google */}
          <SourceCard
            color={SOURCE_COLOR.google}
            title="Google Contacts"
            description="ייבוא כל אנשי הקשר מחשבון Google שלך"
            status={sources.google.status}
            count={sources.google.count}
            error={sources.google.error}
            onAction={handleGoogle}
            actionLabel="ייבא"
          />

          {/* Facebook */}
          <SourceCard
            color={SOURCE_COLOR.facebook}
            title="Facebook"
            description="ייבוא חברים משותפים מפייסבוק (רק חברים שאישרו את האפליקציה)"
            status={sources.facebook.status}
            count={sources.facebook.count}
            error={sources.facebook.error}
            onAction={handleFacebook}
            actionLabel="התחבר"
          />

          {/* Instagram */}
          <SourceCard
            color={SOURCE_COLOR.instagram}
            title="Instagram"
            description="ייבוא מקובץ JSON של אינסטגרם (followers_1.json)"
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
                <summary className="cursor-pointer text-[#FF2D78] font-medium">
                  איך מייצאים נתונים מאינסטגרם?
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>הגדרות → פרטיות → הורד את הנתונים שלך</li>
                  <li>בחר פורמט JSON ובקש הורדה</li>
                  <li>פתח את הקובץ followers_1.json מהארכיון שיגיע למייל</li>
                </ol>
              </details>
            )}
          </SourceCard>

          {/* Phone / vCard */}
          <SourceCard
            color={SOURCE_COLOR.phone}
            title="אנשי קשר מהטלפון"
            description="ייבוא מקובץ vCard (.vcf) — מתאים למשתמשי iPhone שאינם מסנכרנים עם Google"
            status={sources.phone.status}
            count={sources.phone.count}
            error={sources.phone.error}
            onAction={() => vcardInputRef.current?.click()}
            actionLabel="בחר .vcf"
          >
            <input
              ref={vcardInputRef}
              type="file"
              accept=".vcf,.vcard"
              className="hidden"
              onChange={handleVCardFile}
            />
            {sources.phone.status === 'idle' && (
              <details className="text-xs text-gray-500 mt-2">
                <summary className="cursor-pointer text-[#FF2D78] font-medium">
                  איך מייצאים מ-iPhone?
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>פתח את אפליקציית אנשי הקשר</li>
                  <li>לחץ על הגדרות (⚙) → ייצוא אנשי קשר</li>
                  <li>בחר "כל אנשי הקשר" → שתף → שמור לקבצים</li>
                  <li>העלה את קובץ ה-.vcf כאן</li>
                </ol>
              </details>
            )}
          </SourceCard>

          {/* Manual */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SOURCE_COLOR.manual}`} />
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

        {/* Bottom action area */}
        <AnimatePresence>
          {totalContacts > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {/* Contact count */}
              <div className="glass rounded-2xl p-4 mb-4 text-center">
                <p className="text-2xl font-black text-gray-800">{totalContacts}</p>
                <p className="text-gray-500 text-sm">אנשי קשר מוכנים למיון</p>
              </div>

              {/* Save state */}
              {isSaved ? (
                /* Already saved — show confirmation and Start button */
                <div className="space-y-3">
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-green-200">
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-none stroke-white stroke-2">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </span>
                    <p className="text-green-700 text-sm font-medium">
                      {savedCount} אנשי קשר נשמרו ב-Google Sheets — כל שינוי יתעדכן אוטומטית
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    disabled={isStarting}
                    className="w-full gradient-pink text-white font-black py-4 rounded-2xl text-lg shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isStarting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : 'התחל מיון'}
                  </motion.button>
                </div>
              ) : (
                /* Not saved yet — primary: Save, secondary: Start without saving */
                <div className="space-y-2">
                  {saveError && (
                    <div className="glass rounded-xl p-3 border border-red-200">
                      <p className="text-red-600 text-sm font-medium mb-1">{saveError}</p>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer text-[#FF2D78] font-medium">בדיקת תצורה נפוצה</summary>
                        <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                          <li>כנס ל-Google Cloud Console ← APIs &amp; Services ← Library</li>
                          <li>חפש "Google Sheets API" ← Enable</li>
                          <li>חפש "Google Drive API" ← Enable</li>
                          <li>חזור לכאן והתחבר מחדש עם Google</li>
                        </ol>
                      </details>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving || !user}
                    className="w-full gradient-pink text-white font-black py-4 rounded-2xl text-base shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        שומר ל-Google Sheets...
                      </>
                    ) : 'שמור ל-Google Sheets והתחל'}
                  </motion.button>

                  <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="w-full glass text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-white/70 transition-all disabled:opacity-60"
                  >
                    התחל ללא שמירה
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {totalContacts === 0 && !checkingResume && (
          <p className="text-white/70 text-center text-sm mt-4">
            ייבא לפחות מקור אחד כדי להתחיל
          </p>
        )}
      </div>
    </div>
  );
}

// ─── SourceCard ────────────────────────────────────────────────────────────────

interface SourceCardProps {
  color: string;
  title: string;
  description: string;
  status: Status;
  count: number;
  error?: string;
  onAction: () => void;
  actionLabel: string;
  children?: React.ReactNode;
}

function SourceCard({ color, title, description, status, count, error, onAction, actionLabel, children }: SourceCardProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
            <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
            {status === 'done' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {count}
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
              : 'gradient-pink text-white'}
            disabled:opacity-60
          `}
        >
          {status === 'loading' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'done' ? (
            'יובא'
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </div>
  );
}
