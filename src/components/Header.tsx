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
      <div
        className="flex items-center justify-between px-3 pt-safe-top pt-2.5 pb-2"
        style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 50%, #EF4444 100%)' }}
      >
        {/* Left: logos + title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <img src="/adumim.svg" alt="אדומים" className="h-3 shrink-0 opacity-90" />
          <h1 className="text-white font-extrabold text-base tracking-tight truncate">{title}</h1>
        </div>

        {/* Right: sync + user */}
        {user && (
          <div className="flex items-center gap-1.5 shrink-0">
            {syncStatus === 'syncing' && (
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/50 border-t-transparent animate-spin" title="מסנכרן..." />
            )}
            {syncStatus === 'idle' && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" title="מסונכרן" />
            )}
            {syncStatus === 'error' && (
              <div className="relative">
                <button
                  onClick={() => setShowSyncError((v) => !v)}
                  className="w-2.5 h-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
                  title="שגיאת סנכרון — לחץ לפרטים"
                />
                {showSyncError && syncError && (
                  <div className="absolute left-0 top-4 z-50 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed" dir="ltr">
                    {syncError}
                    <button onClick={() => setShowSyncError(false)} className="block mt-1 text-gray-400 hover:text-white">✕ close</button>
                  </div>
                )}
              </div>
            )}
            <img
              src={user.picture}
              alt={user.name}
              className="w-6 h-6 rounded-full ring-[1.5px] ring-white/40"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={signOut}
              className="text-white/50 hover:text-white text-[10px] transition-colors"
              title="יציאה"
            >
              יציאה
            </button>
          </div>
        )}
      </div>

      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #B91C1C, #FFD700, #B91C1C)' }} />

      {showProgress}
    </div>
  );
}
