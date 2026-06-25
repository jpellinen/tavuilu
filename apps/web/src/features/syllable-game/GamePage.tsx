import { useState, useEffect } from 'react'
import type { Word } from '@tavuilu/shared'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProgressStore } from '../../stores/progressStore'
import { useGameHeaderStore } from '../../stores/gameHeaderStore'
import { useWords } from '../../hooks/useWords'
import { useLocale } from '../../hooks/useLocale'
import { useAuth } from '../auth/useAuth'
import { preloadImages } from '../../utils/preloadImages'
import { RegisterPrompt } from '../auth/RegisterPrompt'
import { GameRound } from './GameRound'
import { RoundSummary } from './RoundSummary'
import { selectRoundWords } from './selectNextWord'
import styles from './game.module.css'

const ROUND_SIZE = 5

export function GamePage() {
  const t = useLocale()
  const language = useSettingsStore((s) => s.language)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const completedWordIds = useProgressStore((s) => s.completedWordIds)
  const { setActive, setProgress } = useGameHeaderStore()
  const { isAnonymous } = useAuth()
  const { words, loading, error } = useWords(language, difficulty)

  useEffect(() => {
    setActive(true)
    return () => setActive(false)
  }, [setActive])
  const [sessionWords, setSessionWords] = useState(words)
  const [sessionPlayed, setSessionPlayed] = useState<string[]>([])
  const [roundWords, setRoundWords] = useState<Word[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const [registerPromptDismissed, setRegisterPromptDismissed] = useState(false)

  const [roundXP, setRoundXP] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    setProgress(roundIndex, roundWords.length)
  }, [roundIndex, roundWords.length, setProgress])

  function startRound(played: string[]) {
    const effectiveSize = Math.min(ROUND_SIZE, words.length)
    const selected = selectRoundWords(words, completedWordIds, played, effectiveSize)
    preloadImages(selected)
    setSessionPlayed([...played, ...selected.map((w) => w.id)])
    setRoundWords(selected)
    setRoundIndex(0)
    setRoundXP(0)
    setShowSummary(false)
  }

  function handleWordComplete(earnedXP: number) {
    const nextIndex = roundIndex + 1
    setRoundXP((prev) => prev + earnedXP)

    if (nextIndex >= roundWords.length) {
      setShowSummary(true)
      setShowRegisterPrompt(true)
    } else {
      setRoundIndex(nextIndex)
    }
  }

  function handleNextRound() {
    startRound(sessionPlayed)
  }

  if (sessionWords !== words) {
    setSessionWords(words)
    const currentWord = roundWords[roundIndex]
    if (currentWord && words.some((word) => word.id === currentWord.id)) {
      startRound([currentWord.id])
    } else {
      startRound([])
    }
  }

  if (loading) {
    return <div className={styles.status}>{t.loadingWords}</div>
  }

  const currentWord = roundWords[roundIndex]

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
      <GameRound word={currentWord} onRoundComplete={handleWordComplete} />
      {isAnonymous && showRegisterPrompt && !registerPromptDismissed && (
        <RegisterPrompt onDismiss={() => setRegisterPromptDismissed(true)} />
      )}
    </>
  )
}
