import { useLocale } from '../hooks/useLocale'
import styles from './Game.module.css'

export function Game() {
  const t = useLocale()
  return (
    <div className={styles.page}>
      <h1>Peli</h1>
      <p>Tavupeli tulee tänne.</p>
      <button disabled>{t.checkAnswer}</button>
    </div>
  )
}
