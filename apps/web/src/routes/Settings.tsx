import { useLocale } from '../hooks/useLocale'
import { useSettingsStore } from '../stores/settingsStore'
import styles from './Settings.module.css'

export function Settings() {
  const t = useLocale()
  const { language, difficulty, setLanguage, setDifficulty } = useSettingsStore()

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
    </div>
  )
}
