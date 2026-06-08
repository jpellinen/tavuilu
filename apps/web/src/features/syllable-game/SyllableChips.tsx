import type { RoundChip } from './useGameRound'
import { SyllableChip } from './SyllableChip'
import styles from './SyllableChips.module.css'

interface SyllableChipsProps {
  chips: RoundChip[]
}

export function SyllableChips({ chips }: SyllableChipsProps) {
  return (
    <div className={styles.chipsRow} role="group">
      {chips.map((chip) => (
        <SyllableChip key={chip.id} id={chip.id} syllable={chip.syllable} />
      ))}
    </div>
  )
}
