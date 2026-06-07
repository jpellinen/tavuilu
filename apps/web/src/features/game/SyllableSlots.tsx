import type { Word } from '@tavuilu/shared'
import { useLocale } from '../../hooks/useLocale'
import { DropSlot } from './DropSlot'
import type { RoundChip } from './useGameRound'
import styles from './SyllableSlots.module.css'

interface SyllableSlotsProps {
  word: Word
  slotContents: (RoundChip | null)[]
  onRemoveChip: (slotIndex: number) => void
}

export function SyllableSlots({ word, slotContents, onRemoveChip }: SyllableSlotsProps) {
  const t = useLocale()

  return (
    <div className={styles.slotsRow} role="group" aria-label={word.word}>
      {word.syllables.map((_, i) => (
        <DropSlot
          key={i}
          index={i}
          chip={slotContents[i] ?? null}
          ariaLabel={`${t.slotLabel} ${i + 1}`}
          onRemove={() => onRemoveChip(i)}
        />
      ))}
    </div>
  )
}
