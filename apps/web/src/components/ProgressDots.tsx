import { memo, useMemo } from 'react'
import styles from './ProgressDots.module.css'

interface ProgressDotsProps {
  wordsCompleted: number
  roundSize: number
  label: string
}

export const ProgressDots = memo(function ProgressDots({
  wordsCompleted,
  roundSize,
  label,
}: ProgressDotsProps) {
  const clamped = useMemo(() => {
    const size = Math.max(0, roundSize)
    const completed = Math.max(0, Math.min(wordsCompleted, size))
    const fraction = size > 1 ? completed / (size - 1) : 0
    return { size, completed, fraction: Math.min(fraction, 1) }
  }, [wordsCompleted, roundSize])

  if (clamped.size === 0) return null

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={clamped.completed + 1}
      aria-valuemax={clamped.size}
      aria-label={`${label} ${clamped.completed + 1}/${clamped.size}`}
    >
      <div
        className={styles.fill}
        style={{ width: `calc(${clamped.fraction} * (100% - var(--dot-size)))` }}
      />
      {Array.from({ length: clamped.size }, (_, i) => (
        <span
          key={i}
          className={
            i < clamped.completed
              ? styles.dotDone
              : i === clamped.completed
                ? styles.dotActive
                : styles.dot
          }
        />
      ))}
    </div>
  )
})
