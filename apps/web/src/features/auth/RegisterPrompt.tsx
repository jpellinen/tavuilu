import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { useLocale } from '../../hooks/useLocale'
import styles from './RegisterPrompt.module.css'

interface RegisterPromptProps {
  onDismiss: () => void
}

export function RegisterPrompt({ onDismiss }: RegisterPromptProps) {
  const t = useLocale()
  const navigate = useNavigate()

  return (
    <div className={styles.banner} role="status">
      <p className={styles.message}>{t.registerPromptMessage}</p>
      <div className={styles.actions}>
        <Button variant="accent" size="sm" onClick={() => navigate('/auth/register')}>
          {t.createAccount}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          {t.registerPromptDismiss}
        </Button>
      </div>
    </div>
  )
}
