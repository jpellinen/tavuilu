import { useLocale } from '../hooks/useLocale'
import styles from './Game.module.css'

export function Game() {
  const t = useLocale()
  return (
    <div className={styles.page}>
      <h1>{t.game}</h1>
      <p>{t.gamePlaceholder}</p>
      <button disabled>{t.checkAnswer}</button>
    </div>
  )
}
