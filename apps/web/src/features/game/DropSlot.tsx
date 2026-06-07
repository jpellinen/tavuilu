import { useDroppable } from '@dnd-kit/core'
import type { RoundChip } from './useGameRound'
import { SLOT_DROPPABLE_PREFIX } from './useGameRound'
import { SyllableChip } from './SyllableChip'
import styles from './DropSlot.module.css'

interface DropSlotProps {
  index: number
  chip: RoundChip | null
  ariaLabel: string
  onRemove: () => void
}

export function DropSlot({ index, chip, ariaLabel, onRemove }: DropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `${SLOT_DROPPABLE_PREFIX}${index}` })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.slot} ${chip !== null ? styles.filled : styles.empty} ${isOver ? styles.over : ''}`}
      aria-label={ariaLabel}
      onClick={chip !== null ? onRemove : undefined}
    >
      {chip !== null && <SyllableChip id={chip.id} syllable={chip.syllable} />}
    </div>
  )
}
