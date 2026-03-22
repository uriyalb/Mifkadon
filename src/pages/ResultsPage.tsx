import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { SelectedContact, Priority } from '../types/contact';
import { syncApprovedTab, getSpreadsheetUrl, syncTrackingSheet } from '../services/googleSheets';
import type { TrackingStats } from '../services/googleSheets';
import { NUM_CHAPTERS } from '../config/chapters';
import ContactAvatar from '../components/ContactAvatar';
import Header from '../components/Header';
import { PRIORITY_LABELS } from '../config/labels';
import { RESULTS_TEXT } from '../config/textResults';

interface Props {
  onReset: () => void;
}

const PRIORITY_CONFIG: Record<Priority, { bgClass: string; textColor: string; bgLight: string; border: string }> = {
  high:   { bgClass: 'gradient-high',   textColor: 'text-green-700',  bgLight: 'bg-green-50',  border: 'border-green-200' },
  medium: { bgClass: 'gradient-medium', textColor: 'text-lime-700',   bgLight: 'bg-lime-50',   border: 'border-lime-200' },
  low:    { bgClass: 'gradient-low',    textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-200' },
};

export default function ResultsPage({ onReset }: Props) {
  const { user, demoMode } = useAuth();
  const { session, spreadsheetId, trackingSheetId, resetSession } = useSession();
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

  // Auto-sync approved tab and tracking sheet when results page opens
  useEffect(() => {
    if (demoMode || !user || !spreadsheetId || selected.length === 0) return;
    setIsSyncing(true);
    syncApprovedTab(user.accessToken, spreadsheetId, selected)
      .then(() => {
        setSheetUrl(getSpreadsheetUrl(spreadsheetId));
      })
      .catch(() => {
        setError(RESULTS_TEXT.sync.syncFailed);
      })
      .finally(() => setIsSyncing(false));

    // Also sync tracking sheet (fire-and-forget)
    if (trackingSheetId && session) {
      const totalContacts = session.contacts.length + session.selected.length + session.dismissed.length;
      const totalApproved = session.selected.length;
      const totalRejected = session.dismissed.length;
      const stats: TrackingStats = {
        userName: user.name,
        userEmail: user.email,
        totalContacts,
        totalSorted: totalApproved + totalRejected,
        totalApproved,
        totalRejected,
        currentChapter: (session.currentChapter ?? 0) + 1,
        totalChapters: NUM_CHAPTERS,
        highCount: session.selected.filter((c) => c.priority === 'high').length,
        mediumCount: session.selected.filter((c) => c.priority === 'medium').length,
        lowCount: session.selected.filter((c) => c.priority === 'low').length,
        totalSecondsSpent: session.totalSecondsSpent ?? 0,
        sessionSorted: (totalApproved + totalRejected) - (session.sessionStartSorted ?? 0),
      };
      syncTrackingSheet(user.accessToken, trackingSheetId, session.selected, stats);
    }
  }, []);

  const displayedContacts = activeTab === 'all' ? selected : byPriority[activeTab];

  const handleReset = () => {
    resetSession();
    onReset();
  };

  return (
    <div className="h-[100dvh] flex flex-col" dir="rtl">
      <Header title={RESULTS_TEXT.title} />

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
                <p className="text-white font-black text-3xl">{byPriority[p].length}</p>
                <p className="text-white/90 text-[10px] font-bold leading-tight px-1">{PRIORITY_LABELS[p].zoneName}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Total */}
        <div className="glass rounded-2xl p-3 mb-4 flex items-center justify-between">
          <span className="text-gray-600 text-sm">{RESULTS_TEXT.totalSelected}</span>
          <span className="font-black text-2xl text-gray-900">{selected.length}</span>
        </div>

        {/* Google Sheets sync */}
        <div className="glass rounded-2xl p-4 mb-4">
          {demoMode ? (
            <p className="text-gray-500 text-sm text-center">
              <strong>{RESULTS_TEXT.demo.label}</strong> — {RESULTS_TEXT.demo.text}
            </p>
          ) : isSyncing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 text-sm">{RESULTS_TEXT.sync.syncing}</span>
            </div>
          ) : sheetUrl ? (
            <div>
              <p className="text-green-600 font-bold text-sm mb-2">{RESULTS_TEXT.sync.success}</p>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full gradient-pink text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {RESULTS_TEXT.sync.openSheets}
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
                    .catch(() => setError(RESULTS_TEXT.sync.error))
                    .finally(() => setIsSyncing(false));
                }}
                className="gradient-pink text-white font-bold py-2 px-4 rounded-xl text-sm"
              >
                {RESULTS_TEXT.sync.retry}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{RESULTS_TEXT.sync.noSheet}</p>
          )}
        </div>

        {/* Tab filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <TabChip label={RESULTS_TEXT.tabs.all} count={selected.length} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
          <TabChip label={PRIORITY_LABELS.high.zoneName} count={byPriority.high.length} active={activeTab === 'high'} onClick={() => setActiveTab('high')} color="bg-green-100 text-green-700" />
          <TabChip label={PRIORITY_LABELS.medium.zoneName} count={byPriority.medium.length} active={activeTab === 'medium'} onClick={() => setActiveTab('medium')} color="bg-lime-100 text-lime-700" />
          <TabChip label={PRIORITY_LABELS.low.zoneName} count={byPriority.low.length} active={activeTab === 'low'} onClick={() => setActiveTab('low')} color="bg-yellow-100 text-yellow-700" />
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
                  {PRIORITY_LABELS[contact.priority].zoneName}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {selected.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-white/60 text-2xl font-black">—</span>
            </div>
            <p className="text-white/70">{RESULTS_TEXT.emptyState}</p>
          </div>
        )}

        {/* Reset */}
        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="glass text-gray-600 font-bold py-3 px-6 rounded-2xl text-sm hover:bg-white/80 transition-all"
          >
            {RESULTS_TEXT.restart}
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
