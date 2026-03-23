import { useEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SessionProvider, useSession, SESSION_DATA_KEY, SPREADSHEET_KEY } from './context/SessionContext'
import LoginPage from './pages/LoginPage'
import ImportPage from './pages/ImportPage'
import SwipePage from './pages/SwipePage'
import ResultsPage from './pages/ResultsPage'
import TutorialModal from './components/TutorialModal'
import WalkthroughOverlay from './components/WalkthroughOverlay'
import LevelSummaryScreen from './components/LevelSummaryScreen'
import JourneyMap from './components/JourneyMap'
import { AnimatePresence } from 'framer-motion'
import { mockContacts } from './data/mockContacts'
import { JOURNEY } from './data/journeyRoute'
import type { ChapterStats } from './types/contact'

export type AppPage = 'login' | 'import' | 'swipe' | 'results'

// Dummy stats shown on the post-walkthrough LevelSummaryScreen
const TUTORIAL_STATS: ChapterStats = {
  kept: 3,
  skipped: 2,
  priorityBreakdown: { high: 1, medium: 1, low: 1, registered: 1 },
  secondsElapsed: 45,
}

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

type WalkthroughPhase = 'overlay' | 'summary' | 'map'

function AppRouter() {
  const { user, isLoading, demoMode } = useAuth()
  const [page, setPage] = useState<AppPage>('login')
  const [showTutorial, setShowTutorial] = useState(false)
  const [walkthroughActive, setWalkthroughActive] = useState(false)
  const [walkthroughPhase, setWalkthroughPhase] = useState<WalkthroughPhase>('overlay')
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

  // Auto-show walkthrough for first-time users when entering the swipe page.
  // Returning users (who already have a spreadsheet) see the TutorialModal via
  // the help button only — no auto-popup.
  useEffect(() => {
    if (page === 'swipe' && !tutorialShownRef.current) {
      tutorialShownRef.current = true;
      const isFirstLaunch = !localStorage.getItem(SPREADSHEET_KEY);
      if (isFirstLaunch) {
        // New user: skip TutorialModal, go straight to interactive walkthrough
        setWalkthroughActive(true);
        setWalkthroughPhase('overlay');
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

      {/* Main swipe page — hidden while walkthrough is active */}
      {page === 'swipe' && !walkthroughActive && (
        <SwipePage
          onFinish={() => setPage('results')}
          onBack={() => setPage('import')}
          onOpenTutorial={() => setShowTutorial(true)}
        />
      )}

      {/* Walkthrough overlay — only the interactive card phase */}
      {walkthroughActive && walkthroughPhase === 'overlay' && (
        <WalkthroughOverlay
          onComplete={() => {
            setWalkthroughPhase('summary');
          }}
        />
      )}

      {/* Post-walkthrough: chapter-end summary screen */}
      <AnimatePresence>
        {walkthroughActive && walkthroughPhase === 'summary' && (
          <LevelSummaryScreen
            chapterIndex={0}
            arrivedCity={JOURNEY[1]?.name ?? 'יעד ראשון'}
            flavorText={JOURNEY[1]?.flavor ?? ''}
            stats={TUTORIAL_STATS}
            difficulty="easy"
            onNext={() => setWalkthroughPhase('map')}
            isLastChapter={false}
          />
        )}
      </AnimatePresence>

      {/* Post-walkthrough: journey map with character moving to first city */}
      <AnimatePresence>
        {walkthroughActive && walkthroughPhase === 'map' && (
          <JourneyMap
            completedChapter={0}
            cities={JOURNEY}
            onContinue={() => {
              setWalkthroughActive(false);
              setWalkthroughPhase('overlay');
            }}
            isLastChapter={false}
          />
        )}
      </AnimatePresence>

      {page === 'results' && (
        <ResultsPage onReset={() => setPage('import')} />
      )}

      {/* Tutorial modal — accessible from the help button for returning users */}
      <TutorialModal
        open={showTutorial}
        onStartWalkthrough={() => {
          setShowTutorial(false);
          setWalkthroughActive(true);
          setWalkthroughPhase('overlay');
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
