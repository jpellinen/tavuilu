import type { Word } from '@tavuilu/shared'
import { getImageUrl } from '../../utils/getImageUrl'
import styles from './WordDisplay.module.css'

interface WordDisplayProps {
  word: Word
}

export function WordDisplay({ word }: WordDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={styles.imageStage}>
        <div className={styles.imageFrame}>
          <img src={getImageUrl(word.imageRef)} alt={word.word} className={styles.image} />
        </div>
      </div>
    </div>
  )
}
