import { useState } from 'react'
import type { Word } from '@tavuilu/shared'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { GameRound } from './GameRound'
import styles from './game.module.css'

function pickNextWord(words: Word[], excludeId?: string): Word | null {
  if (words.length === 0) return null
  const candidates = words.filter((word) => word.id !== excludeId)
  const pool = candidates.length > 0 ? candidates : words
  return pool[Math.floor(Math.random() * pool.length)]
}

export function GamePage() {
  const t = useLocale()
  const language = useSettingsStore((s) => s.language)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const { words, loading, error } = useWords(language, difficulty)
  const [sessionWords, setSessionWords] = useState(words)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)

  if (sessionWords !== words) {
    setSessionWords(words)
    setCurrentWord((prev) =>
      prev && words.some((word) => word.id === prev.id) ? prev : pickNextWord(words)
    )
  }

  if (loading) {
    return <div className={styles.status}>{t.loadingWords}</div>
  }

  if (error || !currentWord) {
    return <div className={styles.status}>{t.errorLoadingWords}</div>
  }

  return (
    <GameRound
      word={currentWord}
      onRoundComplete={() => setCurrentWord((prev) => pickNextWord(words, prev?.id))}
    />
  )
}
