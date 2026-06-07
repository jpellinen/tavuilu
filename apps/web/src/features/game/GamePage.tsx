import { useSettingsStore } from '../../stores/settingsStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { GameRound } from './GameRound'
import styles from './game.module.css'

export function GamePage() {
  const t = useLocale()
  const language = useSettingsStore((s) => s.language)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const { words, loading, error } = useWords(language, difficulty)

  if (loading) {
    return <div className={styles.status}>{t.loadingWords}</div>
  }

  if (error || words.length === 0) {
    return <div className={styles.status}>{t.errorLoadingWords}</div>
  }

  return <GameRound word={words[0]} />
}
