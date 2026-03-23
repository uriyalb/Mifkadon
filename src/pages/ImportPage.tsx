import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact } from '../types/contact';
import { fetchGoogleContacts } from '../services/googleContacts';
import { readFacebookFile } from '../services/facebookContacts';
import { readInstagramFile } from '../services/instagramImport';
import { readVCardFile } from '../services/vcardImport';
import {
  findExistingSpreadsheet,
  createSpreadsheet,
  initContactsTab,
  loadAllContactRows,
  appendContactsToSheet,
  loadAllContactsWithStatus,
  protectProgressColumns,
  findExistingTrackingSheet,
  createTrackingSheet,
  loadProgressTab,
  saveProgressTab,
  ensureProgressTab,
} from '../services/googleSheets';
import type { ProgressTabData } from '../types/contact';
import Header from '../components/Header';
import { IMPORT_TEXT } from '../config/textImport';
import { JOURNEY } from '../data/journeyRoute';
import { CHAPTERS } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';

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
  const { initSession, restoreSession, setSpreadsheetId, setTrackingSheetId, getProgressSnapshot, resetSession } = useSession();

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
  const [resumeInfo, setResumeInfo] = useState<{
    spreadsheetId: string; pending: number; processed: number; total: number;
    progressTab: ProgressTabData | null;
  } | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);
  // Whether the user chose to add new contacts instead of resuming
  const [showNewImport, setShowNewImport] = useState(false);

  const facebookInputRef = useRef<HTMLInputElement>(null);
  const instagramInputRef = useRef<HTMLInputElement>(null);
  const vcardInputRef = useRef<HTMLInputElement>(null);

  // Check for an existing spreadsheet to offer resume
  useEffect(() => {
    if (!user) { setCheckingResume(false); return; }
    findExistingSpreadsheet(user.accessToken, user.email)
      .then(async (id) => {
        if (id) {
          const [data, progressTab] = await Promise.all([
            loadAllContactsWithStatus(user.accessToken, id),
            loadProgressTab(user.accessToken, id),
          ]);
          if (data.pending.length > 0) {
            setResumeInfo({
              spreadsheetId: id,
              pending: data.pending.length,
              processed: data.selected.length + data.dismissedIds.length,
              total: data.allContacts.length,
              progressTab,
            });
          }
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

  const handleFacebookFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSource('facebook', { status: 'loading' });
    try {
      const contacts = await readFacebookFile(file);
      updateSource('facebook', { status: 'done', count: contacts.length });
      addContacts(contacts);
    } catch (err) {
      updateSource('facebook', { status: 'error', error: (err as Error).message });
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
      if (contacts.length === 0) throw new Error(IMPORT_TEXT.errors.noContacts);
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

  // Ensure tracking sheet exists (find or create), fire-and-forget style
  const ensureTrackingSheet = async () => {
    if (!user) return;
    try {
      const existingTrackingId = await findExistingTrackingSheet(user.accessToken, user.email);
      if (existingTrackingId) {
        setTrackingSheetId(existingTrackingId);
      } else {
        const trackingId = await createTrackingSheet(user.accessToken, user.email);
        setTrackingSheetId(trackingId);
      }
    } catch {
      // Non-critical: tracking sheet failure should not block the user
      console.warn('[import] Failed to create/find tracking sheet');
    }
  };

  const handleResume = async () => {
    if (!user || !resumeInfo) return;
    setIsStarting(true);
    try {
      const data = await loadAllContactsWithStatus(user.accessToken, resumeInfo.spreadsheetId);
      setSpreadsheetId(resumeInfo.spreadsheetId);
      restoreSession(data, resumeInfo.progressTab);

      // Ensure progress tab exists (migration for existing users) and save current state
      ensureProgressTab(user.accessToken, resumeInfo.spreadsheetId)
        .then(() => {
          const snap = getProgressSnapshot();
          if (snap) saveProgressTab(user.accessToken, resumeInfo.spreadsheetId, snap);
        })
        .catch(() => {});

      ensureTrackingSheet();
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
        await protectProgressColumns(user.accessToken, existingId);
        // Reload full contact list so session includes existing + new.
        // Load progress from sheet to preserve immutable chapter sizes.
        const [sheetData, progressTab] = await Promise.all([
          loadAllContactsWithStatus(user.accessToken, existingId),
          loadProgressTab(user.accessToken, existingId),
        ]);
        setAllContacts(sheetData.pending);
        setSpreadsheetId(existingId);
        // Contacts changed — restoreSession will redistribute chapter sizes
        restoreSession(sheetData, progressTab);
        // Save the recalculated sizes back to the sheet
        ensureProgressTab(user.accessToken, existingId)
          .then(() => {
            const snap = getProgressSnapshot();
            if (snap) saveProgressTab(user.accessToken, existingId, snap);
          })
          .catch(() => {});
        setSavedCount(sheetData.allContacts.length);
      } else {
        const sheetId = await createSpreadsheet(user.accessToken, user.email);
        await initContactsTab(user.accessToken, sheetId, allContacts);
        await protectProgressColumns(user.accessToken, sheetId);
        resetSession();
        setSpreadsheetId(sheetId);
        setSavedCount(allContacts.length);
      }
      ensureTrackingSheet();
    } catch (e) {
      const msg = (e as Error).message ?? '';
      if (msg.includes('has not been used') || msg.includes('is disabled') || msg.includes('SERVICE_DISABLED')) {
        setSaveError(IMPORT_TEXT.errors.apiDisabled);
      } else if (msg.includes('insufficient') || msg.includes('PERMISSION_DENIED')) {
        setSaveError(IMPORT_TEXT.errors.noPermission);
      } else {
        setSaveError(msg || IMPORT_TEXT.errors.sheetsSave);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Start sorting (only after saving) ────────────────────────────────────

  const handleStart = () => {
    if (allContacts.length === 0) return;
    setIsStarting(true);
    initSession(allContacts);
    onStart();
  };

  const totalContacts = allContacts.length;
  const isSaved = savedCount !== null;

  // ── Loading splash screen ─────────────────────────────────────────────────

  if (checkingResume) {
    return (
      <div
        className="h-[100dvh] flex flex-col items-center justify-center gap-6"
        style={{ background: 'linear-gradient(135deg, #E53935 0%, #EF5350 40%, #FFCDD2 70%, #FFF5F5 100%)' }}
      >
        {/* Animated Ilan sprite */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 86,
            height: 96,
            backgroundImage: 'url(/Ilan_sprite.png)',
            backgroundSize: '400% 300%',
            backgroundPosition: '0% 0%',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 6px 16px rgba(255, 107, 53, 0.5))',
            animation: 'ilan-ride-sprite 2s linear infinite',
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-white font-bold text-base">בודק נתונים קיימים...</p>
        </div>
      </div>
    );
  }

  // ── Hero resume screen (when existing progress found) ────────────────────

  if (resumeInfo && !showNewImport) {
    const pct = resumeInfo.total > 0 ? Math.round((resumeInfo.processed / resumeInfo.total) * 100) : 0;
    return (
      <div className="h-[100dvh] flex flex-col" dir="rtl" style={{ background: 'linear-gradient(135deg, #E53935 0%, #EF5350 40%, #FFCDD2 70%, #FFF5F5 100%)' }}>
        <Header />
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2 flex flex-col">
          {/* Hero resume card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-3xl p-6 mb-4 text-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Ilan sprite */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-4"
              style={{
                width: 86,
                height: 96,
                backgroundImage: 'url(/Ilan_sprite.png)',
                backgroundSize: '400% 300%',
                backgroundPosition: '0% 0%',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 6px 16px rgba(255, 107, 53, 0.5))',
                animation: 'ilan-ride-sprite 2s linear infinite',
              }}
            />

            <h2 className="text-2xl font-black text-white mb-1 drop-shadow">ברוכים השבים!</h2>
            <p className="text-white/80 text-sm mb-5 leading-relaxed">
              {IMPORT_TEXT.resume.title} — {IMPORT_TEXT.resume.info(resumeInfo.processed, resumeInfo.total, resumeInfo.pending)}
            </p>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-white/70 mb-1.5 font-medium">
                <span>{resumeInfo.processed} מוינו</span>
                <span>{pct}%</span>
                <span>{resumeInfo.pending} נשארו</span>
              </div>
              <div className="h-3 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FFD700, #FF6B35)' }}
                />
              </div>
            </div>

            {/* Chapter journey detail */}
            {resumeInfo.progressTab && (() => {
              const pt = resumeInfo.progressTab;
              const ch = pt.currentChapter;
              const totalChapters = pt.chapterSizes.length;
              const cityName = JOURNEY[ch + 1]?.name ?? JOURNEY[JOURNEY.length - 1].name;
              const diff = CHAPTERS[ch]?.difficulty ?? 'easy';
              const diffLabel = DIFFICULTY_LABELS[diff];
              return (
                <div className="mb-4">
                  {/* Chapter indicator + difficulty */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-white font-bold text-sm">
                      {IMPORT_TEXT.chapterInfo.label(ch + 1, totalChapters)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: diffLabel.bg }}>
                      {IMPORT_TEXT.chapterInfo.difficulty[diff]}
                    </span>
                    <span className="text-white/70 text-xs">
                      — {cityName}
                    </span>
                  </div>
                  {/* Segmented chapter bar */}
                  <div className="flex gap-1 h-2">
                    {pt.chapterSizes.map((size, i) => {
                      const chStart = pt.chapterSizes.slice(0, i).reduce((a, b) => a + b, 0);
                      const chEnd = chStart + size;
                      const processed = resumeInfo.processed;
                      let fillPct = 0;
                      if (processed >= chEnd) fillPct = 100;
                      else if (processed > chStart) fillPct = Math.round(((processed - chStart) / size) * 100);
                      const isCurrent = i === ch;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-full overflow-hidden"
                          style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: isCurrent ? '1px solid rgba(255,215,0,0.6)' : 'none',
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${fillPct}%`,
                              background: fillPct === 100
                                ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                                : 'linear-gradient(90deg, #FFD700, #FF6B35)',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Stats pills */}
            <div className="flex justify-center gap-3 mb-5">
              <div className="px-3 py-2 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <p className="text-xl font-black text-white">{resumeInfo.total}</p>
                <p className="text-white/70 text-[11px]">סה״כ אנשי קשר</p>
              </div>
              <div className="px-3 py-2 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <p className="text-xl font-black text-white">{resumeInfo.processed}</p>
                <p className="text-white/70 text-[11px]">מוינו</p>
              </div>
              <div className="px-3 py-2 rounded-2xl text-center" style={{ background: 'rgba(255,215,0,0.25)' }}>
                <p className="text-xl font-black text-white">{resumeInfo.pending}</p>
                <p className="text-white/70 text-[11px]">ממתינים</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResume}
              disabled={isStarting}
              className="w-full text-white font-black py-4 rounded-2xl text-lg shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #E53935, #B71C1C)',
                boxShadow: '0 8px 24px rgba(183, 28, 28, 0.45)',
              }}
            >
              {isStarting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>המשך מהיכן שהפסקת</span>
                  <span className="text-xl">←</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Divider to add more contacts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => setShowNewImport(true)}
              className="text-white/60 text-sm underline underline-offset-2 hover:text-white/90 transition-colors"
            >
              + הוסף עוד אנשי קשר ממקור חדש
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Standard import screen ────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] flex flex-col" dir="rtl" style={{ background: 'linear-gradient(135deg, #E53935 0%, #EF5350 40%, #FFCDD2 70%, #FFF5F5 100%)' }}>
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">

        <h2 className="text-white font-bold text-xl mb-4">{IMPORT_TEXT.title}</h2>

        {/* Source cards */}
        <div className="space-y-3 mb-6">

          {/* Google */}
          <SourceCard
            color={SOURCE_COLOR.google}
            title={IMPORT_TEXT.sources.google.title}
            description={IMPORT_TEXT.sources.google.desc}
            status={sources.google.status}
            count={sources.google.count}
            error={sources.google.error}
            onAction={handleGoogle}
            actionLabel={IMPORT_TEXT.sources.google.action}
          />

          {/* Facebook */}
          <SourceCard
            color={SOURCE_COLOR.facebook}
            title={IMPORT_TEXT.sources.facebook.title}
            description={IMPORT_TEXT.sources.facebook.desc}
            status={sources.facebook.status}
            count={sources.facebook.count}
            error={sources.facebook.error}
            onAction={() => facebookInputRef.current?.click()}
            actionLabel={IMPORT_TEXT.sources.facebook.action}
          >
            <input
              ref={facebookInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFacebookFile}
            />
            {sources.facebook.status === 'idle' && (
              <div className="text-xs text-gray-500 mt-2 space-y-1.5">
                <a
                  href="https://www.facebook.com/dyi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#E53935] font-medium underline underline-offset-2"
                >
                  {IMPORT_TEXT.instructions.facebook.linkText}
                </a>
                <details>
                  <summary className="cursor-pointer text-[#E53935] font-medium">{IMPORT_TEXT.instructions.facebook.summary}</summary>
                  <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                    {IMPORT_TEXT.instructions.facebook.steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </details>
              </div>
            )}
          </SourceCard>

          {/* Instagram */}
          <SourceCard
            color={SOURCE_COLOR.instagram}
            title={IMPORT_TEXT.sources.instagram.title}
            description={IMPORT_TEXT.sources.instagram.desc}
            status={sources.instagram.status}
            count={sources.instagram.count}
            error={sources.instagram.error}
            onAction={() => instagramInputRef.current?.click()}
            actionLabel={IMPORT_TEXT.sources.instagram.action}
          >
            <input
              ref={instagramInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleInstagramFile}
            />
            {sources.instagram.status === 'idle' && (
              <div className="text-xs text-gray-500 mt-2 space-y-1.5">
                <a
                  href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#E53935] font-medium underline underline-offset-2"
                >
                  {IMPORT_TEXT.instructions.instagram.linkText}
                </a>
                <details>
                  <summary className="cursor-pointer text-[#E53935] font-medium">{IMPORT_TEXT.instructions.instagram.summary}</summary>
                  <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                    {IMPORT_TEXT.instructions.instagram.steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </details>
              </div>
            )}
          </SourceCard>

          {/* Phone / vCard */}
          <SourceCard
            color={SOURCE_COLOR.phone}
            title={IMPORT_TEXT.sources.phone.title}
            description={IMPORT_TEXT.sources.phone.desc}
            status={sources.phone.status}
            count={sources.phone.count}
            error={sources.phone.error}
            onAction={() => vcardInputRef.current?.click()}
            actionLabel={IMPORT_TEXT.sources.phone.action}
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
                <summary className="cursor-pointer text-[#E53935] font-medium">
                  {IMPORT_TEXT.instructions.iphone.summary}
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                  {IMPORT_TEXT.instructions.iphone.steps.map((step, i) => <li key={i}>{step}</li>)}
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
                  <h3 className="font-bold text-gray-800 text-sm">{IMPORT_TEXT.manual.title}</h3>
                  {sources.manual.count > 0 && (
                    <p className="text-xs text-gray-500">{IMPORT_TEXT.manual.count(sources.manual.count)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowManual((v) => !v)}
                className="text-[#E53935] text-sm font-bold"
              >
                {showManual ? IMPORT_TEXT.manual.closeButton : IMPORT_TEXT.manual.addButton}
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
                      placeholder={IMPORT_TEXT.manual.fields.name}
                      value={manualForm.name}
                      onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E53935]"
                    />
                    <input
                      type="tel"
                      placeholder={IMPORT_TEXT.manual.fields.phone}
                      value={manualForm.phone}
                      onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E53935]"
                    />
                    <input
                      type="email"
                      placeholder={IMPORT_TEXT.manual.fields.email}
                      value={manualForm.email}
                      onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E53935]"
                    />
                    <button
                      onClick={handleAddManual}
                      disabled={!manualForm.name.trim()}
                      className="w-full gradient-pink text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                      {IMPORT_TEXT.manual.submitButton}
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
                <p className="text-gray-500 text-sm">{IMPORT_TEXT.ready.subtitle}</p>
              </div>

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
                      {IMPORT_TEXT.ready.sheetsInfo(savedCount!)}
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
                    ) : IMPORT_TEXT.ready.startButton}
                  </motion.button>
                </div>
              ) : (
                /* Not saved yet — show Save to Google Sheets button only */
                <div className="space-y-2">
                  {saveError && (
                    <div className="glass rounded-xl p-3 border border-red-200">
                      <p className="text-red-600 text-sm font-medium mb-1">{saveError}</p>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer text-[#E53935] font-medium">{IMPORT_TEXT.instructions.apiSetup.summary}</summary>
                        <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed">
                          {IMPORT_TEXT.instructions.apiSetup.steps.map((step, i) => <li key={i}>{step}</li>)}
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
                        {IMPORT_TEXT.ready.savingMessage}
                      </>
                    ) : IMPORT_TEXT.ready.startWithSheetsButton}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {totalContacts === 0 && (
          <p className="text-white/70 text-center text-sm mt-4">
            {IMPORT_TEXT.emptyState}
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
            IMPORT_TEXT.imported
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </div>
  );
}
