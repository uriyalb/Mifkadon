import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { SelectedContact, Priority } from '../types/contact';
import { syncApprovedTab, getSpreadsheetUrl } from '../services/googleSheets';
import ContactAvatar from '../components/ContactAvatar';
import Header from '../components/Header';

interface Props {
  onReset: () => void;
}

const PRIORITY_CONFIG = {
  high: { label: 'עדיפות גבוהה', emoji: '🔥', bgClass: 'gradient-high', textColor: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200' },
  medium: { label: 'עדיפות בינונית', emoji: '⭐', bgClass: 'gradient-medium', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50', border: 'border-yellow-200' },
  low: { label: 'עדיפות נמוכה', emoji: '✓', bgClass: 'gradient-low', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
};

export default function ResultsPage({ onReset }: Props) {
  const { user, demoMode } = useAuth();
  const { session, spreadsheetId, resetSession } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Priority | 'all'>('all');

  const selected = session?.selected ?? [];

  const byPriority: Record<Priority, SelectedContact[]> = {
    high: selected.filter((c) => c.priority === 'high'),
    medium: selected.filter((c) => c.priority === 'medium'),
    low: selected.filter((c) => c.priority === 'low'),
  };

  // Auto-sync approved tab when results page opens
  useEffect(() => {
    if (demoMode || !user || !spreadsheetId || selected.length === 0) return;
    setIsSyncing(true);
    syncApprovedTab(user.accessToken, spreadsheetId, selected)
      .then(() => {
        setSheetUrl(getSpreadsheetUrl(spreadsheetId));
      })
      .catch(() => {
        setError('לא הצלחנו לסנכרן עם Google Sheets. נסה שוב.');
      })
      .finally(() => setIsSyncing(false));
  }, []);

  const displayedContacts = activeTab === 'all' ? selected : byPriority[activeTab];

  const handleReset = () => {
    resetSession();
    onReset();
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header title="התוצאות" />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <motion.div
                key={p}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab((prev) => prev === p ? 'all' : p)}
                className={`${cfg.bgClass} rounded-2xl p-3 text-center cursor-pointer shadow-md transition-all ${activeTab === p ? 'ring-4 ring-white/60 scale-105' : ''}`}
              >
                <span className="text-2xl">{cfg.emoji}</span>
                <p className="text-white font-black text-xl">{byPriority[p].length}</p>
                <p className="text-white/80 text-[10px]">{cfg.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Total */}
        <div className="glass rounded-2xl p-3 mb-4 flex items-center justify-between">
          <span className="text-gray-600 text-sm">סה"כ נבחרו</span>
          <span className="font-black text-2xl text-gray-900">{selected.length}</span>
        </div>

        {/* Google Sheets sync */}
        <div className="glass rounded-2xl p-4 mb-4">
          {demoMode ? (
            <p className="text-gray-500 text-sm text-center">
              🎭 <strong>מצב דמו</strong> — התחבר עם Google לייצוא ל-Google Sheets
            </p>
          ) : isSyncing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 text-sm">מסנכרן עם Google Sheets...</span>
            </div>
          ) : sheetUrl ? (
            <div>
              <p className="text-green-600 font-bold text-sm mb-2">✅ הנתונים סונכרנו בהצלחה!</p>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full gradient-pink text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span>📊</span> פתח Google Sheets
              </a>
            </div>
          ) : error ? (
            <div>
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <button
                onClick={() => {
                  if (!user || !spreadsheetId) return;
                  setError(null);
                  setIsSyncing(true);
                  syncApprovedTab(user.accessToken, spreadsheetId, selected)
                    .then(() => setSheetUrl(getSpreadsheetUrl(spreadsheetId)))
                    .catch(() => setError('שגיאה בסנכרון. נסה שוב.'))
                    .finally(() => setIsSyncing(false));
                }}
                className="gradient-pink text-white font-bold py-2 px-4 rounded-xl text-sm"
              >
                נסה שוב
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">לא נמצא Google Sheet. התחל סשן חדשה לחיבור.</p>
          )}
        </div>

        {/* Tab filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <TabChip label="הכל" count={selected.length} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
          <TabChip label="🔥 גבוהה" count={byPriority.high.length} active={activeTab === 'high'} onClick={() => setActiveTab('high')} color="bg-red-100 text-red-600" />
          <TabChip label="⭐ בינונית" count={byPriority.medium.length} active={activeTab === 'medium'} onClick={() => setActiveTab('medium')} color="bg-yellow-100 text-yellow-600" />
          <TabChip label="✓ נמוכה" count={byPriority.low.length} active={activeTab === 'low'} onClick={() => setActiveTab('low')} color="bg-emerald-100 text-emerald-600" />
        </div>

        {/* Contact list */}
        <AnimatePresence mode="popLayout">
          {displayedContacts.map((contact) => {
            const cfg = PRIORITY_CONFIG[contact.priority];
            return (
              <motion.div
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass rounded-2xl p-3 mb-2 flex items-center gap-3 border ${cfg.border}`}
              >
                <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} size="sm" source={contact.source} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{contact.name}</p>
                  {contact.phone && <p className="text-xs text-gray-500" dir="ltr">{contact.phone}</p>}
                  {!contact.phone && contact.email && <p className="text-xs text-gray-500 truncate">{contact.email}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${cfg.bgLight} ${cfg.textColor}`}>
                  {cfg.emoji}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {selected.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl">🤷</span>
            <p className="text-white/70 mt-3">לא נבחרו אנשי קשר</p>
          </div>
        )}

        {/* Reset */}
        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="glass text-gray-600 font-bold py-3 px-6 rounded-2xl text-sm hover:bg-white/80 transition-all"
          >
            🔄 התחל מחדש
          </button>
        </div>
      </div>
    </div>
  );
}

function TabChip({ label, count, active, onClick, color = 'bg-pink-100 text-[#FF2D78]' }: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        active ? `${color} ring-2 ring-current/30` : 'bg-white/50 text-gray-600'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/40' : 'bg-gray-100'}`}>
        {count}
      </span>
    </button>
  );
}
