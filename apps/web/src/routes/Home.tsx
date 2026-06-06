import { Link } from 'react-router'
import { Button } from '../components/Button'
import styles from './Home.module.css'

export function Home() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tervetuloa Tavuiluun!</h1>
      <p className={styles.lead}>Opitaan lukemaan yhdessä.</p>
      <Link to="/game">
        <Button size="lg">Aloita peli</Button>
      </Link>
    </div>
  )
}
