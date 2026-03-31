import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SelectedContact, ContactTrackingData, Priority } from '../types/contact';
import { PRIORITY_LABELS, SOURCE_LABELS } from '../config/labels';
import { JOURNEY } from '../data/journeyRoute';
import { CHAPTERS } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';

interface Props {
  onClose: () => void;
  activeChapter: number;
  approved: SelectedContact[];
  trackingData: Map<string, ContactTrackingData> | null; // null = loading
  chapterSizes: number[];
  totalSecondsSpent: number;
  updateContactStatus: (contactId: string, status: string) => void;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2, registered: 3 };

const PRESET_STATUSES = [
  'לא צלצלתי',
  'אין מענה',
  'דיברתי – מעוניין',
  'דיברתי – לא מעוניין',
  'פקד/ה',
  'נקבעה פגישה',
  'אחר...',
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ProgressDashboard({
  onClose,
  activeChapter,
  approved,
  trackingData,
  chapterSizes,
  totalSecondsSpent,
  updateContactStatus,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openStatusEditor = (id: string) => {
    setEditingStatusId((prev) => (prev === id ? null : id));
    setShowCustomInput(false);
    setCustomStatusInput('');
  };

  const applyStatus = (contactId: string, status: string) => {
    updateContactStatus(contactId, status);
    setEditingStatusId(null);
    setShowCustomInput(false);
    setCustomStatusInput('');
  };

  const sorted = [...approved].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const highCount = approved.filter((c) => c.priority === 'high').length;
  const mediumCount = approved.filter((c) => c.priority === 'medium').length;
  const lowCount = approved.filter((c) => c.priority === 'low').length;
  const registeredCount = approved.filter((c) => c.priority === 'registered').length;

  const totalProcessed = chapterSizes.slice(0, activeChapter).reduce((a, b) => a + b, 0);
  const totalContacts = chapterSizes.reduce((a, b) => a + b, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #2d0d45 100%)' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-lg font-black text-white leading-tight">רשימת פוטנציאל מפקד</h2>
          <p className="text-xs text-white/40 mt-0.5">התקדמות שלי במסע</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-bold hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">

        {/* ── Journey map ── */}
        <div
          className="rounded-2xl p-4 mb-4 mt-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] font-bold text-white/50 text-center mb-3 tracking-wider uppercase">מפת המסע</p>

          {/* Scrollable dot-track */}
          <div
            className="overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div
              className="flex items-start gap-0"
              dir="ltr"
              style={{ minWidth: 'max-content', margin: '0 auto', paddingLeft: 8, paddingRight: 8 }}
            >
              {JOURNEY.map((city, i) => {
                const isCompleted = i <= activeChapter;
                const isCurrent = i === activeChapter + 1;
                const isLast = i === JOURNEY.length - 1;
                return (
                  <div key={i} className="flex items-center">
                    {/* City stop */}
                    <div className="flex flex-col items-center" style={{ width: 44 }}>
                      <div
                        className={`rounded-full transition-all ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent' : ''}`}
                        style={{
                          width: isCurrent ? 16 : isCompleted ? 12 : 9,
                          height: isCurrent ? 16 : isCompleted ? 12 : 9,
                          background: isCompleted
                            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                            : isCurrent
                              ? '#FFD700'
                              : 'rgba(255,255,255,0.18)',
                          boxShadow: isCurrent ? '0 0 8px rgba(255,215,0,0.6)' : isCompleted ? '0 0 4px rgba(255,165,0,0.4)' : 'none',
                        }}
                      />
                      <span
                        className="text-center leading-tight mt-1.5"
                        style={{
                          fontSize: 8,
                          color: isCurrent ? '#FFD700' : isCompleted ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                          fontWeight: isCurrent ? 800 : isCompleted ? 600 : 400,
                          maxWidth: 42,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {city.name}
                      </span>
                    </div>
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        style={{
                          width: 18,
                          height: 2,
                          borderRadius: 1,
                          marginBottom: 18,
                          background: i < activeChapter + 1
                            ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                            : 'rgba(255,255,255,0.12)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chapter label */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] text-white/50">
              פרק {activeChapter + 1} מתוך {CHAPTERS.length}
            </span>
            {activeChapter < CHAPTERS.length && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].color + '28',
                  color: DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].color,
                }}
              >
                {DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].text}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white/70">סה״כ אושרו</span>
            <span className="text-2xl font-black text-white">{approved.length}</span>
          </div>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <PriorityPill priority="high" count={highCount} />
            <PriorityPill priority="medium" count={mediumCount} />
            <PriorityPill priority="low" count={lowCount} />
            <PriorityPill priority="registered" count={registeredCount} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/40">זמן כולל</span>
            <span className="text-sm font-bold text-white/60 tabular-nums">{formatTime(totalSecondsSpent)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/40">התקדמות</span>
            <span className="text-sm font-bold text-white/60 tabular-nums">{totalProcessed} / {totalContacts}</span>
          </div>
        </div>

        {/* ── Contacts list header ── */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">
            אנשי קשר שאושרו
            <span className="mr-1.5 text-white/40 font-normal">({approved.length})</span>
          </h3>
          {trackingData === null && (
            <span className="text-xs text-white/35 animate-pulse">טוען נתונים...</span>
          )}
        </div>

        {/* ── Contact cards ── */}
        <div className="flex flex-col gap-3">
          {sorted.map((contact) => {
            const tracking = trackingData?.get((contact.phone ?? '').trim()) ?? null;
            const isExpanded = expandedIds.has(contact.id);
            const hasSummary = tracking?.callSummary && tracking.callSummary.trim().length > 0;
            const isEditingStatus = editingStatusId === contact.id;

            return (
              <div
                key={contact.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* ── Card top: name + priority + edit button ── */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white leading-tight truncate">{contact.name}</p>
                    {contact.phone && (
                      <p className="text-xs text-white/45 font-mono mt-0.5" dir="ltr">{contact.phone}</p>
                    )}
                    {!contact.phone && contact.email && (
                      <p className="text-xs text-white/45 truncate mt-0.5">{contact.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mr-2 shrink-0">
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: PRIORITY_LABELS[contact.priority].color + '22',
                        color: PRIORITY_LABELS[contact.priority].color,
                        border: `1px solid ${PRIORITY_LABELS[contact.priority].color}40`,
                      }}
                    >
                      {PRIORITY_LABELS[contact.priority].text}
                    </span>
                  </div>
                </div>

                {/* ── Status row ── */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2">
                    {/* Current status chip or placeholder */}
                    {contact.status ? (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-1 min-w-0 truncate"
                        style={{
                          background: 'rgba(255,215,0,0.12)',
                          color: 'rgba(255,215,0,0.85)',
                          border: '1px solid rgba(255,215,0,0.25)',
                        }}
                      >
                        {contact.status}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/25 flex-1">אין סטטוס</span>
                    )}
                    {/* Edit button */}
                    <button
                      onClick={() => openStatusEditor(contact.id)}
                      className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
                      style={{
                        background: isEditingStatus ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                        color: isEditingStatus ? 'white' : 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {isEditingStatus ? '✕ סגור' : '✏️ עדכן סטטוס'}
                    </button>
                  </div>

                  {/* ── Inline status editor ── */}
                  {isEditingStatus && (
                    <div className="mt-2.5">
                      {/* Preset chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_STATUSES.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              if (preset === 'אחר...') {
                                setShowCustomInput(true);
                              } else {
                                applyStatus(contact.id, preset);
                              }
                            }}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
                            style={{
                              background: contact.status === preset
                                ? 'rgba(255,215,0,0.25)'
                                : 'rgba(255,255,255,0.08)',
                              color: contact.status === preset
                                ? 'rgba(255,215,0,0.95)'
                                : 'rgba(255,255,255,0.6)',
                              border: contact.status === preset
                                ? '1px solid rgba(255,215,0,0.4)'
                                : '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      {/* Custom text input */}
                      {showCustomInput && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={customStatusInput}
                            onChange={(e) => setCustomStatusInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customStatusInput.trim()) {
                                applyStatus(contact.id, customStatusInput.trim());
                              }
                            }}
                            placeholder="כתוב סטטוס..."
                            className="flex-1 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.18)',
                            }}
                            dir="rtl"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (customStatusInput.trim()) {
                                applyStatus(contact.id, customStatusInput.trim());
                              }
                            }}
                            disabled={!customStatusInput.trim()}
                            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
                            style={{
                              background: 'rgba(255,215,0,0.2)',
                              color: 'rgba(255,215,0,0.9)',
                              border: '1px solid rgba(255,215,0,0.3)',
                            }}
                          >
                            שמור
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Tracking data (from Google Sheets) ── */}
                {trackingData !== null && (
                  <div className="border-t border-white/[0.07] mx-4 pt-2.5 pb-3">
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-white/35 block mb-0.5">שיחה אחרונה</span>
                        <span className="text-white/65 font-bold">{tracking?.lastCallDate || '—'}</span>
                      </div>
                      <div>
                        <span className="text-white/35 block mb-0.5">שיחה הבאה</span>
                        <span className="text-white/65 font-bold">{tracking?.nextCallDate || '—'}</span>
                      </div>
                      <div>
                        <span className="text-white/35 block mb-0.5">התפקד/ה?</span>
                        <span
                          className="font-bold"
                          style={{
                            color:
                              tracking?.registered && tracking.registered.trim()
                                ? '#22C55E'
                                : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {tracking?.registered || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Source + expandable summary */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-white/35">
                        {SOURCE_LABELS[contact.source] ?? contact.source}
                      </span>
                      {hasSummary && (
                        <button
                          onClick={() => toggleExpand(contact.id)}
                          className="text-[10px] text-amber-400/70 flex items-center gap-1"
                        >
                          <span>{isExpanded ? '▲' : '▼'}</span>
                          <span>סיכום שיחה</span>
                        </button>
                      )}
                    </div>
                    {isExpanded && hasSummary && (
                      <div className="mt-1.5 text-[11px] text-white/55 bg-white/5 rounded-xl p-2.5 leading-relaxed">
                        {tracking!.callSummary}
                      </div>
                    )}
                  </div>
                )}

                {/* Loading skeleton */}
                {trackingData === null && (
                  <div className="border-t border-white/[0.07] mx-4 pt-2.5 pb-3">
                    <div className="h-2.5 w-36 bg-white/5 rounded animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}

          {approved.length === 0 && (
            <div className="text-center py-12 text-white/25 text-sm">
              עדיין לא אושרו אנשי קשר
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PriorityPill({ priority, count }: { priority: Priority; count: number }) {
  const cfg = PRIORITY_LABELS[priority];
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
    >
      <span>{count}</span>
      <span>{cfg.text}</span>
    </div>
  );
}
