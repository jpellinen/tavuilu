import { useSettingsStore } from '../../stores/settingsStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { WordDisplay } from './WordDisplay'
import { SyllableSlots } from './SyllableSlots'
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

  const currentWord = words[0]
  const emptySlots = Array<string | null>(currentWord.syllables.length).fill(null)

  return (
    <div className={styles.page}>
      <WordDisplay word={currentWord} />
      <SyllableSlots word={currentWord} slotContents={emptySlots} />
    </div>
  )
}
