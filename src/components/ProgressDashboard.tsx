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
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2, registered: 3 };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ProgressDashboard({ onClose, activeChapter, approved, trackingData, chapterSizes, totalSecondsSpent }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sorted = [...approved].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const highCount = approved.filter((c) => c.priority === 'high').length;
  const mediumCount = approved.filter((c) => c.priority === 'medium').length;
  const lowCount = approved.filter((c) => c.priority === 'low').length;
  const registeredCount = approved.filter((c) => c.priority === 'registered').length;

  // Journey progress: how many chapters completed
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
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-black text-white">התקדמות שלי</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {/* Compact journey map */}
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-1 justify-center" dir="ltr">
            {JOURNEY.map((city, i) => {
              const isCompleted = i <= activeChapter;
              const isCurrent = i === activeChapter + 1;
              const isLast = i === JOURNEY.length - 1;
              return (
                <div key={i} className="flex items-center">
                  {/* City dot */}
                  <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
                    <div
                      className={`rounded-full ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent' : ''}`}
                      style={{
                        width: isCurrent ? 14 : isCompleted ? 10 : 8,
                        height: isCurrent ? 14 : isCompleted ? 10 : 8,
                        background: isCompleted
                          ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                          : isCurrent
                            ? '#FFD700'
                            : 'rgba(255,255,255,0.2)',
                      }}
                    />
                    <span
                      className="text-[8px] mt-1 text-center leading-tight whitespace-nowrap"
                      style={{
                        color: isCurrent ? '#FFD700' : isCompleted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                        fontWeight: isCurrent ? 800 : 400,
                        maxWidth: 40,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {city.name}
                    </span>
                  </div>
                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      style={{
                        width: 16,
                        height: 2,
                        borderRadius: 1,
                        background: i < activeChapter + 1
                          ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                          : 'rgba(255,255,255,0.15)',
                        marginBottom: 14, // align with dot, not label
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Chapter progress text */}
          <div className="text-center mt-3">
            <span className="text-xs text-white/60">
              פרק {activeChapter + 1} מתוך {CHAPTERS.length}
            </span>
            {activeChapter < CHAPTERS.length && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded mr-2"
                style={{
                  backgroundColor: DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].color + '30',
                  color: DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].color,
                }}
              >
                {DIFFICULTY_LABELS[CHAPTERS[activeChapter].difficulty].text}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white/80">סה״כ אושרו</span>
            <span className="text-xl font-black text-white">{approved.length}</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <PriorityPill priority="high" count={highCount} />
            <PriorityPill priority="medium" count={mediumCount} />
            <PriorityPill priority="low" count={lowCount} />
            <PriorityPill priority="registered" count={registeredCount} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/50">זמן כולל</span>
            <span className="text-sm font-bold text-white/70 tabular-nums">{formatTime(totalSecondsSpent)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/50">התקדמות</span>
            <span className="text-sm font-bold text-white/70 tabular-nums">{totalProcessed} / {totalContacts}</span>
          </div>
        </div>

        {/* Approved contacts list */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">אנשי קשר שאושרו ({approved.length})</h3>
          {trackingData === null && (
            <span className="text-xs text-white/40 animate-pulse">טוען נתונים...</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {sorted.map((contact) => {
            const tracking = trackingData?.get((contact.phone ?? '').trim()) ?? null;
            const isExpanded = expandedIds.has(contact.id);
            const hasSummary = tracking?.callSummary && tracking.callSummary.trim().length > 0;

            return (
              <div
                key={contact.id}
                className="bg-white/8 rounded-xl p-3 border border-white/5"
              >
                {/* Top row: name + priority */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{contact.name}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: PRIORITY_LABELS[contact.priority].color + '25',
                      color: PRIORITY_LABELS[contact.priority].color,
                    }}
                  >
                    {PRIORITY_LABELS[contact.priority].text}
                  </span>
                </div>

                {/* Phone + source */}
                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                  {contact.phone && (
                    <span dir="ltr" className="font-mono">{contact.phone}</span>
                  )}
                  <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                    {SOURCE_LABELS[contact.source] ?? contact.source}
                  </span>
                </div>

                {/* Tracking data */}
                {trackingData !== null && (
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-white/40 block">שיחה אחרונה</span>
                        <span className="text-white/70 font-bold">
                          {tracking?.lastCallDate || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block">שיחה הבאה</span>
                        <span className="text-white/70 font-bold">
                          {tracking?.nextCallDate || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block">התפקד/ה?</span>
                        <span
                          className="font-bold"
                          style={{
                            color: tracking?.registered && tracking.registered.trim()
                              ? '#22C55E'
                              : 'rgba(255,255,255,0.3)',
                          }}
                        >
                          {tracking?.registered || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable call summary */}
                    {hasSummary && (
                      <button
                        onClick={() => toggleExpand(contact.id)}
                        className="mt-2 text-[10px] text-amber-400/80 flex items-center gap-1"
                      >
                        <span>{isExpanded ? '▲' : '▼'}</span>
                        <span>סיכום שיחה</span>
                      </button>
                    )}
                    {isExpanded && hasSummary && (
                      <div className="mt-1 text-[11px] text-white/60 bg-white/5 rounded-lg p-2 leading-relaxed">
                        {tracking!.callSummary}
                      </div>
                    )}
                  </div>
                )}

                {/* Loading state for tracking */}
                {trackingData === null && (
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}

          {approved.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
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
