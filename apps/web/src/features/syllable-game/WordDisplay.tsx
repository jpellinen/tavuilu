import type { Word } from '@tavuilu/shared'
import { getImageUrl } from '../../utils/getImageUrl'
import { Confetti } from './Confetti'
import styles from './WordDisplay.module.css'

interface WordDisplayProps {
  word: Word
  celebrate?: boolean
}

export function WordDisplay({ word, celebrate = false }: WordDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={styles.imageStage}>
        <div className={styles.imageFrame}>
          <img src={getImageUrl(word.imageRef)} alt={word.word} className={styles.image} />
        </div>
        {celebrate && <Confetti key={word.id} />}
      </div>
    </div>
  )
}
