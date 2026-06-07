import { useMemo } from 'react'
import type { Word } from '@tavuilu/shared'
import { shuffle } from './shuffle'
import { SyllableChip } from './SyllableChip'
import styles from './SyllableChips.module.css'

interface SyllableChipsProps {
  word: Word
}

export function SyllableChips({ word }: SyllableChipsProps) {
  const shuffled = useMemo(() => shuffle(word.syllables), [word])

  return (
    <div className={styles.chipsRow} role="group">
      {shuffled.map((syllable, i) => (
        <SyllableChip key={`${syllable}-${i}`} syllable={syllable} />
      ))}
    </div>
  )
}
