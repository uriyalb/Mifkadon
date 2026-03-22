import { useEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SessionProvider, useSession, SESSION_DATA_KEY, SPREADSHEET_KEY } from './context/SessionContext'
import LoginPage from './pages/LoginPage'
import ImportPage from './pages/ImportPage'
import SwipePage from './pages/SwipePage'
import ResultsPage from './pages/ResultsPage'
import TutorialModal from './components/TutorialModal'
import WalkthroughOverlay from './components/WalkthroughOverlay'
import { mockContacts } from './data/mockContacts'

export type AppPage = 'login' | 'import' | 'swipe' | 'results'

function DemoAutoStart({ onStart }: { onStart: () => void }) {
  const { initSession, session } = useSession();
  const navigated = useRef(false);

  useEffect(() => {
    initSession(mockContacts);
  }, []);

  // Wait for session state to be set before navigating to SwipePage,
  // otherwise SwipePage mounts with session===null and contacts never load.
  useEffect(() => {
    if (session && !navigated.current) {
      navigated.current = true;
      onStart();
    }
  }, [session]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
    </div>
  );
}

function AppRouter() {
  const { user, isLoading, demoMode } = useAuth()
  const [page, setPage] = useState<AppPage>('login')
  const [showTutorial, setShowTutorial] = useState(false)
  const [walkthroughActive, setWalkthroughActive] = useState(false)
  const tutorialShownRef = useRef(false)

  useEffect(() => {
    if (user && page === 'login') {
      const hasActiveSession = !!localStorage.getItem(SESSION_DATA_KEY);
      setPage(hasActiveSession ? 'swipe' : 'import')
    }
    if (!user) {
      setPage('login')
    }
  }, [user])

  // Auto-show tutorial for first-time users when entering the swipe page
  useEffect(() => {
    if (page === 'swipe' && !tutorialShownRef.current) {
      tutorialShownRef.current = true;
      const isFirstLaunch = !localStorage.getItem(SPREADSHEET_KEY);
      if (isFirstLaunch) {
        setShowTutorial(true);
      }
    }
  }, [page]);

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
      {page === 'swipe' && !walkthroughActive && (
        <SwipePage
          onFinish={() => setPage('results')}
          onBack={() => setPage('import')}
          onOpenTutorial={() => setShowTutorial(true)}
        />
      )}
      {walkthroughActive && (
        <WalkthroughOverlay
          onComplete={() => {
            setWalkthroughActive(false);
          }}
        />
      )}
      {page === 'results' && (
        <ResultsPage onReset={() => setPage('import')} />
      )}

      <TutorialModal
        open={showTutorial}
        onStartWalkthrough={() => {
          setShowTutorial(false);
          setWalkthroughActive(true);
        }}
        onSkip={() => setShowTutorial(false)}
      />
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
