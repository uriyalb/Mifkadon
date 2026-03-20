import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

interface Props {
  title?: string;
  showProgress?: React.ReactNode;
}

export default function Header({ title = 'מיפקדון', showProgress }: Props) {
  const { user, signOut } = useAuth();
  const { syncStatus, syncError } = useSession();
  const [showSyncError, setShowSyncError] = useState(false);

  return (
    <div className="flex flex-col shrink-0">
      {/* Main header bar */}
      <div
        className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-2.5"
        style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 50%, #EF4444 100%)' }}
      >
        {/* Left: logos + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/adumim.svg"
            alt="אדומים"
            className="h-4 shrink-0 opacity-90"
          />
          <div className="w-px h-5 bg-white/25 shrink-0" />
          <h1 className="text-white font-extrabold text-lg tracking-tight truncate">{title}</h1>
        </div>

        {/* Right: sync + user */}
        {user && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync status indicator */}
            {syncStatus === 'syncing' && (
              <div className="w-3 h-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" title="מסנכרן..." />
            )}
            {syncStatus === 'idle' && (
              <div className="w-2 h-2 rounded-full bg-green-300" title="מסונכרן" />
            )}
            {syncStatus === 'error' && (
              <div className="relative">
                <button
                  onClick={() => setShowSyncError((v) => !v)}
                  className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
                  title="שגיאת סנכרון — לחץ לפרטים"
                />
                {showSyncError && syncError && (
                  <div className="absolute left-0 top-5 z-50 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed" dir="ltr">
                    {syncError}
                    <button onClick={() => setShowSyncError(false)} className="block mt-1 text-gray-400 hover:text-white">✕ close</button>
                  </div>
                )}
              </div>
            )}
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full ring-2 ring-white/40"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={signOut}
              className="text-white/60 hover:text-white text-[11px] transition-colors"
              title="יציאה"
            >
              יציאה
            </button>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #B91C1C, #FFD700, #B91C1C)' }} />

      {showProgress}
    </div>
  );
}
