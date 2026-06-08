import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Word } from '@tavuilu/shared'
import { useProgressStore } from '../../stores/progressStore'
import { shuffle } from './shuffle'
import { validateAnswer } from './validateAnswer'
import { computeXP } from './computeXP'

export interface RoundChip {
  id: string
  syllable: string
}

export type RoundPhase = 'active' | 'correct' | 'incorrect'

export const SLOT_DROPPABLE_PREFIX = 'slot-'

const NEXT_WORD_DELAY_MS = 1500

function createChips(word: Word): RoundChip[] {
  return shuffle(word.syllables.map((syllable, i) => ({ id: `${word.id}-${i}`, syllable })))
}

function emptySlots(word: Word): (string | null)[] {
  return Array<string | null>(word.syllables.length).fill(null)
}

export function useGameRound(word: Word, onRoundComplete: () => void) {
  const chips = useMemo(() => createChips(word), [word])
  const [slotChipIds, setSlotChipIds] = useState<(string | null)[]>(() => emptySlots(word))
  const [phase, setPhase] = useState<RoundPhase>('active')
  const [roundWordId, setRoundWordId] = useState(word.id)
  const addXP = useProgressStore((s) => s.addXP)
  const markWordCompleted = useProgressStore((s) => s.markWordCompleted)
  const startedAtRef = useRef(0)
  const hadErrorRef = useRef(false)

  if (roundWordId !== word.id) {
    setRoundWordId(word.id)
    setSlotChipIds(emptySlots(word))
    setPhase('active')
  }

  useEffect(() => {
    startedAtRef.current = Date.now()
    hadErrorRef.current = false
  }, [word.id])

  useEffect(() => {
    if (phase !== 'correct') return undefined
    const timeout = setTimeout(onRoundComplete, NEXT_WORD_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [phase, onRoundComplete])

  const chipById = useMemo(() => new Map(chips.map((chip) => [chip.id, chip])), [chips])
  const placedIds = useMemo(
    () => new Set(slotChipIds.filter((id): id is string => id !== null)),
    [slotChipIds]
  )

  const slotContents = slotChipIds.map((id) => (id !== null ? (chipById.get(id) ?? null) : null))
  const unplacedChips = chips.filter((chip) => !placedIds.has(chip.id))
  const isComplete = slotChipIds.every((id) => id !== null)

  function clearIncorrect() {
    setPhase((prev) => (prev === 'incorrect' ? 'active' : prev))
  }

  function removeFromSlot(slotIndex: number) {
    if (phase === 'correct') return
    clearIncorrect()
    setSlotChipIds((prev) => {
      if (prev[slotIndex] === null) return prev
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    if (phase === 'correct') return
    const { active, over } = event
    const chipId = active.id as string

    clearIncorrect()
    setSlotChipIds((prev) => {
      const sourceIndex = prev.indexOf(chipId)
      const overId = over?.id.toString() ?? null

      if (overId === null || !overId.startsWith(SLOT_DROPPABLE_PREFIX)) {
        if (sourceIndex === -1) return prev
        const next = [...prev]
        next[sourceIndex] = null
        return next
      }

      const targetIndex = Number(overId.slice(SLOT_DROPPABLE_PREFIX.length))
      if (targetIndex === sourceIndex) return prev

      const next = [...prev]
      const occupantId = next[targetIndex]
      if (sourceIndex !== -1) next[sourceIndex] = occupantId
      next[targetIndex] = chipId
      return next
    })
  }

  function submit() {
    if (phase !== 'active' || !isComplete) return
    const slots = slotChipIds.map((id) => chipById.get(id as string)?.syllable ?? '')

    if (validateAnswer(slots, word.syllables)) {
      const durationMs = Date.now() - startedAtRef.current
      addXP(computeXP(word.difficulty, durationMs, !hadErrorRef.current))
      markWordCompleted(word.id)
      setPhase('correct')
    } else {
      hadErrorRef.current = true
      setPhase('incorrect')
    }
  }

  return {
    chipById,
    slotContents,
    unplacedChips,
    phase,
    isComplete,
    handleDragEnd,
    removeFromSlot,
    submit,
  }
}
