import styles from './SyllableChip.module.css'

interface SyllableChipProps {
  syllable: string
}

export function SyllableChip({ syllable }: SyllableChipProps) {
  return (
    <div className={styles.chip} aria-label={syllable}>
      {syllable}
    </div>
  )
}
