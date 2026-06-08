import type { Word } from '@tavuilu/shared'
import { motion } from 'motion/react'
import { useLocale } from '../../hooks/useLocale'
import { DropSlot } from './DropSlot'
import type { RoundChip } from './useGameRound'
import styles from './SyllableSlots.module.css'

interface SyllableSlotsProps {
  word: Word
  slotContents: (RoundChip | null)[]
  onRemoveChip: (slotIndex: number) => void
  error?: boolean
}

const SHAKE_KEYFRAMES = [0, -8, 8, -4, 0]

export function SyllableSlots({
  word,
  slotContents,
  onRemoveChip,
  error = false,
}: SyllableSlotsProps) {
  const t = useLocale()

  return (
    <motion.div
      className={styles.slotsRow}
      role="group"
      aria-label={word.word}
      animate={error ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {word.syllables.map((_, i) => (
        <DropSlot
          key={i}
          index={i}
          chip={slotContents[i] ?? null}
          ariaLabel={`${t.slotLabel} ${i + 1}`}
          onRemove={() => onRemoveChip(i)}
          flashError={error}
        />
      ))}
    </motion.div>
  )
}
