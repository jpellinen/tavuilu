import { useState } from 'react'
import type { Word } from '@tavuilu/shared'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { WordDisplay } from './WordDisplay'
import { SyllableSlots } from './SyllableSlots'
import { SyllableChips } from './SyllableChips'
import { SyllableChip } from './SyllableChip'
import { useGameRound, type RoundChip } from './useGameRound'
import styles from './game.module.css'

interface GameRoundProps {
  word: Word
}

export function GameRound({ word }: GameRoundProps) {
  const { chipById, slotContents, unplacedChips, handleDragEnd, removeFromSlot } =
    useGameRound(word)
  const [activeChip, setActiveChip] = useState<RoundChip | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  function onDragStart(event: DragStartEvent) {
    setActiveChip(chipById.get(event.active.id as string) ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveChip(null)
    handleDragEnd(event)
  }

  function onDragCancel() {
    setActiveChip(null)
  }

  return (
    <div className={styles.page}>
      <WordDisplay word={word} />
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SyllableSlots word={word} slotContents={slotContents} onRemoveChip={removeFromSlot} />
        <SyllableChips chips={unplacedChips} />
        <DragOverlay>
          {activeChip && <SyllableChip id={activeChip.id} syllable={activeChip.syllable} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
