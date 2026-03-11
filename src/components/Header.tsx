import React from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  title?: string;
  showProgress?: React.ReactNode;
}

export default function Header({ title = 'מיפקדון', showProgress }: Props) {
  const { user, signOut } = useAuth();

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
