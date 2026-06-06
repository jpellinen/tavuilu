import type { Word } from '@tavuilu/shared'
import { useLocale } from '../../hooks/useLocale'
import { DropSlot } from './DropSlot'
import styles from './SyllableSlots.module.css'

interface SyllableSlotsProps {
  word: Word
  slotContents: (string | null)[]
}

export function SyllableSlots({ word, slotContents }: SyllableSlotsProps) {
  const t = useLocale()

  return (
    <div className={styles.slotsRow} role="group" aria-label={word.word}>
      {word.syllables.map((_, i) => (
        <DropSlot
          key={i}
          index={i}
          content={slotContents[i] ?? null}
          ariaLabel={`${t.slotLabel} ${i + 1}`}
        />
      ))}
    </div>
  )
}
