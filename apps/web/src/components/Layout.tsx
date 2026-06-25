import { Link, Outlet, useLocation } from 'react-router'
import { useLocale } from '../hooks/useLocale'
import { useProgressSync } from '../hooks/useProgressSync'
import { useGameHeaderStore } from '../stores/gameHeaderStore'
import styles from './Layout.module.css'
import { ProgressDots } from './ProgressDots'

function HomeButton({ label }: { label: string }) {
  return (
    <Link to="/" className={styles.homeButton} aria-label={label}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12L12 4l9 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}

export function Layout() {
  const t = useLocale()
  useProgressSync()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isGame = location.pathname === '/game'
  const { active, wordsCompleted, roundSize } = useGameHeaderStore()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {isGame ? (
          <>
            <HomeButton label={t.home} />
            {active && (
              <ProgressDots
                wordsCompleted={wordsCompleted}
                roundSize={roundSize}
                label={t.roundProgress}
              />
            )}
          </>
        ) : (
          !isHome && <HomeButton label={t.home} />
        )}
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
