import { useState } from 'react'
import type { Word } from '@tavuilu/shared'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProgressStore } from '../../stores/progressStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { useAuth } from '../auth/useAuth'
import { RegisterPrompt } from '../auth/RegisterPrompt'
import { GameRound } from './GameRound'
import { RoundSummary } from './RoundSummary'
import { selectNextWord } from './selectNextWord'
import styles from './game.module.css'

const ROUND_SIZE = 5

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

  const [wordsCompletedInRound, setWordsCompletedInRound] = useState(0)
  const [roundXP, setRoundXP] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  const effectiveRoundSize = Math.min(ROUND_SIZE, words.length)

  function advance(played: string[]) {
    const next = selectNextWord(words, completedWordIds, played)
    setCurrentWord(next)
    setSessionPlayed(next ? [...played, next.id] : played)
  }

  function handleWordComplete(earnedXP: number) {
    const newCompleted = wordsCompletedInRound + 1
    setWordsCompletedInRound(newCompleted)
    setRoundXP((prev) => prev + earnedXP)

    if (newCompleted >= effectiveRoundSize) {
      setShowSummary(true)
      setShowRegisterPrompt(true)
    } else {
      advance(sessionPlayed)
    }
  }

  function handleNextRound() {
    setWordsCompletedInRound(0)
    setRoundXP(0)
    setShowSummary(false)
    advance(sessionPlayed)
  }

  if (sessionWords !== words) {
    setSessionWords(words)
    setWordsCompletedInRound(0)
    setRoundXP(0)
    setShowSummary(false)
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

  if (showSummary) {
    return (
      <>
        <RoundSummary roundXP={roundXP} onNextRound={handleNextRound} />
        {isAnonymous && showRegisterPrompt && !registerPromptDismissed && (
          <RegisterPrompt onDismiss={() => setRegisterPromptDismissed(true)} />
        )}
      </>
    )
  }

  return (
    <>
      <GameRound
        word={currentWord}
        wordsCompleted={wordsCompletedInRound}
        roundSize={effectiveRoundSize}
        onRoundComplete={handleWordComplete}
      />
      {isAnonymous && showRegisterPrompt && !registerPromptDismissed && (
        <RegisterPrompt onDismiss={() => setRegisterPromptDismissed(true)} />
      )}
    </>
  )
}
