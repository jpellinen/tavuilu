import { Button } from './components/Button'
import { Card } from './components/Card'
import styles from './App.module.css'

function App() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Tavuilu</h1>
      <p className={styles.subtitle}>Opitaan lukemaan yhdessä!</p>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Painikkeet</h2>
        <div className={styles.row}>
          <Button variant="primary">Aloita peli</Button>
          <Button variant="secondary">Asetukset</Button>
          <Button variant="accent">Kirjaudu</Button>
          <Button variant="ghost">Peruuta</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Pieni</Button>
          <Button size="md">Keski</Button>
          <Button size="lg">Suuri</Button>
        </div>
        <div className={styles.row}>
          <Button disabled>Pois käytöstä</Button>
        </div>
      </Card>

      <Card variant="outlined" className={styles.section}>
        <h2 className={styles.sectionTitle}>Korttivariantit</h2>
        <p>Ääriviivallinen kortti (outlined)</p>
      </Card>

      <Card variant="flat" className={styles.section}>
        <p>Litteä kortti (flat)</p>
      </Card>
    </main>
  )
}

export default App
