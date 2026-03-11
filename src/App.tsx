import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SessionProvider, useSession } from './context/SessionContext'
import LoginPage from './pages/LoginPage'
import ImportPage from './pages/ImportPage'
import SwipePage from './pages/SwipePage'
import ResultsPage from './pages/ResultsPage'
import { mockContacts } from './data/mockContacts'

export type AppPage = 'login' | 'import' | 'swipe' | 'results'

function DemoAutoStart({ onStart }: { onStart: () => void }) {
  const { initSession } = useSession();
  useEffect(() => {
    initSession(mockContacts);
    onStart();
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
    </div>
  );
}

function AppRouter() {
  const { user, isLoading, demoMode } = useAuth()
  const [page, setPage] = useState<AppPage>('login')

  useEffect(() => {
    if (user && page === 'login') {
      setPage('import')
    }
    if (!user) {
      setPage('login')
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user || page === 'login') {
    return <LoginPage onLogin={() => setPage('import')} />
  }

  return (
    <SessionProvider>
      {page === 'import' && (
        demoMode
          ? <DemoAutoStart onStart={() => setPage('swipe')} />
          : <ImportPage onStart={() => setPage('swipe')} />
      )}
      {page === 'swipe' && (
        <SwipePage
          onFinish={() => setPage('results')}
          onBack={() => setPage('import')}
        />
      )}
      {page === 'results' && (
        <ResultsPage onReset={() => setPage('import')} />
      )}
    </SessionProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
