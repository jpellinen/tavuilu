import { useLocale } from '../../hooks/useLocale'
import { Button } from '../../components/Button'
import { Confetti } from './Confetti'
import styles from './game.module.css'

interface RoundSummaryProps {
  roundXP: number
  onNextRound: () => void
}

export function RoundSummary({ roundXP, onNextRound }: RoundSummaryProps) {
  const t = useLocale()

  return (
    <div className={styles.summary}>
      <Confetti />
      <h2 className={styles.summaryHeading}>{t.roundComplete}</h2>
      <p className={styles.summaryXP}>{roundXP}</p>
      <p className={styles.summaryXPLabel}>{t.roundXPEarned}</p>
      <Button variant="accent" size="lg" onClick={onNextRound}>
        {t.nextRound}
      </Button>
    </div>
  )
}
