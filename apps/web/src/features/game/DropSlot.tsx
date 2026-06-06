import styles from './DropSlot.module.css'

interface DropSlotProps {
  index: number
  content: string | null
  ariaLabel: string
}

export function DropSlot({ index, content, ariaLabel }: DropSlotProps) {
  return (
    <div
      className={`${styles.slot} ${content !== null ? styles.filled : styles.empty}`}
      aria-label={ariaLabel}
      data-slot-index={index}
    >
      {content !== null && <span className={styles.chipText}>{content}</span>}
    </div>
  )
}
