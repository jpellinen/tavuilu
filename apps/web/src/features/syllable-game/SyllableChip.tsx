import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import styles from './SyllableChip.module.css'

interface SyllableChipProps {
  id: string
  syllable: string
  overlay?: boolean
}

export function SyllableChip({ id, syllable, overlay = false }: SyllableChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: overlay,
  })

  if (overlay) {
    return (
      <div className={`${styles.chip} ${styles.overlay}`} aria-hidden="true">
        {syllable}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.chip} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      aria-label={syllable}
      {...listeners}
      {...attributes}
    >
      {syllable}
    </div>
  )
}
