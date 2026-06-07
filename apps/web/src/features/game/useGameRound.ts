import { useMemo, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Word } from '@tavuilu/shared'
import { shuffle } from './shuffle'

export interface RoundChip {
  id: string
  syllable: string
}

export const SLOT_DROPPABLE_PREFIX = 'slot-'

function createChips(word: Word): RoundChip[] {
  return shuffle(word.syllables.map((syllable, i) => ({ id: `${word.id}-${i}`, syllable })))
}

function emptySlots(word: Word): (string | null)[] {
  return Array<string | null>(word.syllables.length).fill(null)
}

export function useGameRound(word: Word) {
  const chips = useMemo(() => createChips(word), [word])
  const [slotChipIds, setSlotChipIds] = useState<(string | null)[]>(() => emptySlots(word))
  const [roundWordId, setRoundWordId] = useState(word.id)

  if (roundWordId !== word.id) {
    setRoundWordId(word.id)
    setSlotChipIds(emptySlots(word))
  }

  const chipById = useMemo(() => new Map(chips.map((chip) => [chip.id, chip])), [chips])
  const placedIds = useMemo(
    () => new Set(slotChipIds.filter((id): id is string => id !== null)),
    [slotChipIds]
  )

  const slotContents = slotChipIds.map((id) => (id !== null ? (chipById.get(id) ?? null) : null))
  const unplacedChips = chips.filter((chip) => !placedIds.has(chip.id))

  function removeFromSlot(slotIndex: number) {
    setSlotChipIds((prev) => {
      if (prev[slotIndex] === null) return prev
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const chipId = active.id as string

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

  return { chips, chipById, slotContents, unplacedChips, handleDragEnd, removeFromSlot }
}
