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
    <div className="flex flex-col gap-2 px-4 pt-safe-top pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center text-white font-bold text-sm shadow-md">
            מ
          </div>
          <h1 className="text-white font-extrabold text-xl tracking-tight">{title}</h1>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            {syncStatus === 'syncing' && (
              <div className="w-3 h-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" title="מסנכרן..." />
            )}
            {syncStatus === 'idle' && (
              <div className="w-2 h-2 rounded-full bg-green-400/70" title="מסונכרן" />
            )}
            {syncStatus === 'error' && (
              <div className="relative">
                <button
                  onClick={() => setShowSyncError((v) => !v)}
                  className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors"
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
              className="w-8 h-8 rounded-full ring-2 ring-white/60"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={signOut}
              className="text-white/70 hover:text-white text-xs transition-colors"
              title="יציאה"
            >
              יציאה
            </button>
          </div>
        )}
      </div>

      {showProgress}
    </div>
  );
}
