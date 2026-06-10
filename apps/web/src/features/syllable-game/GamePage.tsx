import { useState } from 'react'
import type { Word } from '@tavuilu/shared'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProgressStore } from '../../stores/progressStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { useAuth } from '../auth/useAuth'
import { RegisterPrompt } from '../auth/RegisterPrompt'
import { GameRound } from './GameRound'
import { selectNextWord } from './selectNextWord'
import styles from './game.module.css'

export function GamePage() {
  const t = useLocale()
  const language = useSettingsStore((s) => s.language)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const completedWordIds = useProgressStore((s) => s.completedWordIds)
  const { isAnonymous } = useAuth()
  const { words, loading, error } = useWords(language, difficulty)
  const [sessionWords, setSessionWords] = useState(words)
  const [sessionPlayed, setSessionPlayed] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const [registerPromptDismissed, setRegisterPromptDismissed] = useState(false)

  function advance(played: string[]) {
    const next = selectNextWord(words, completedWordIds, played)
    setCurrentWord(next)
    setSessionPlayed(next ? [...played, next.id] : played)
  }

  function handleRoundComplete() {
    setShowRegisterPrompt(true)
    advance(sessionPlayed)
  }

  if (sessionWords !== words) {
    setSessionWords(words)
    if (currentWord && words.some((word) => word.id === currentWord.id)) {
      setSessionPlayed([currentWord.id])
    } else {
      advance([])
    }
  }

  if (loading) {
    return <div className={styles.status}>{t.loadingWords}</div>
  }

  if (error || !currentWord) {
    return <div className={styles.status}>{t.errorLoadingWords}</div>
  }

  return (
    <>
      <GameRound word={currentWord} onRoundComplete={handleRoundComplete} />
      {isAnonymous && showRegisterPrompt && !registerPromptDismissed && (
        <RegisterPrompt onDismiss={() => setRegisterPromptDismissed(true)} />
      )}
    </>
  )
}
