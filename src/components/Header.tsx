import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { HEADER_TEXT } from '../config/textHeader';

interface Props {
  title?: string;
  showProgress?: React.ReactNode;
}

export default function Header({ title = HEADER_TEXT.defaultTitle, showProgress }: Props) {
  const { user, signOut } = useAuth();
  const { syncStatus, syncError } = useSession();
  const [showSyncError, setShowSyncError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div className="flex flex-col shrink-0">
      <div
        className="flex items-center justify-between px-3 pt-safe-top pt-2.5 pb-2"
        style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 50%, #EF4444 100%)' }}
      >
        {/* Left: logos + title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img src="/adumim.svg" alt="אדומים" className="h-3 shrink-0 opacity-90" />
          <div className="w-px h-4 bg-white/30 shrink-0" />
          <h1 className="text-white font-extrabold text-base tracking-tight truncate">{title}</h1>
        </div>

        {/* Right: sync + user avatar with dropdown */}
        {user && (
          <div className="flex items-center gap-1.5 shrink-0">
            {syncStatus === 'syncing' && (
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/50 border-t-transparent animate-spin" title={HEADER_TEXT.sync.syncing} />
            )}
            {syncStatus === 'idle' && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" title={HEADER_TEXT.sync.idle} />
            )}
            {syncStatus === 'error' && (
              <div className="relative">
                <button
                  onClick={() => setShowSyncError((v) => !v)}
                  className="w-2.5 h-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
                  title={HEADER_TEXT.sync.errorTooltip}
                />
                {showSyncError && syncError && (
                  <div className="absolute left-0 top-4 z-50 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed" dir="ltr">
                    {syncError}
                    <button onClick={() => setShowSyncError(false)} className="block mt-1 text-gray-400 hover:text-white">{HEADER_TEXT.sync.close}</button>
                  </div>
                )}
              </div>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="focus:outline-none"
                title={user.name}
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 rounded-full ring-[1.5px] ring-white/40 cursor-pointer hover:ring-white/70 transition-all"
                  referrerPolicy="no-referrer"
                />
              </button>
              {showMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-[120px]">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 truncate max-w-[160px]">
                    {user.name}
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); signOut(); }}
                    className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {HEADER_TEXT.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #B91C1C, #FFD700, #B91C1C)' }} />

      {showProgress}
    </div>
  );
}
