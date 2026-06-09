import { Link } from 'react-router'
import { useLocale } from '../hooks/useLocale'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuth } from '../features/auth/useAuth'
import styles from './Settings.module.css'

export function Settings() {
  const t = useLocale()
  const { language, difficulty, setLanguage, setDifficulty } = useSettingsStore()
  const { user, loading, isAnonymous } = useAuth()

  async function handleLogout() {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
    } catch {
      // best-effort
    }
    window.location.href = '/'
  }

  return (
    <div className={styles.page}>
      <h1>{t.settings}</h1>

      <label className={styles.field}>
        <span>{t.language}</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as 'fi' | 'en')}>
          <option value="fi">{t.languageFi}</option>
          <option value="en">{t.languageEn}</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>{t.difficulty}</span>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>

      {!loading && (
        <div className={styles.accountSection}>
          {isAnonymous ? (
            <div className={styles.accountLinks}>
              <Link to="/auth/register" className={styles.accountLink}>
                {t.createAccount}
              </Link>
              <Link to="/auth/login" className={styles.accountLinkSecondary}>
                {t.login}
              </Link>
            </div>
          ) : (
            <div className={styles.accountInfo}>
              <span className={styles.accountEmail}>
                {t.loggedInAs} {user?.email}
              </span>
              <button className={styles.logoutButton} onClick={handleLogout}>
                {t.logOut}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
