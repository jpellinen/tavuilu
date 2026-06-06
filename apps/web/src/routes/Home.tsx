import { Link } from 'react-router'
import { Button } from '../components/Button'
import { useLocale } from '../hooks/useLocale'
import styles from './Home.module.css'

export function Home() {
  const t = useLocale()
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tavuilu</h1>
      <p className={styles.lead}>Opitaan lukemaan yhdessä.</p>
      <Link to="/game">
        <Button size="lg">{t.startGame}</Button>
      </Link>
    </div>
  )
}
