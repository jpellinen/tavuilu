import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { useLocale } from '../../hooks/useLocale'
import styles from './AuthForm.module.css'

export function RegisterPage() {
  const t = useLocale()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError(t.registerError)
        return
      }
      navigate('/settings')
    } catch {
      setError(t.registerError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t.register}</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className={styles.submit}
            disabled={submitting}
          >
            {t.createAccount}
          </Button>
        </form>

        <p className={styles.footer}>
          {t.alreadyHaveAccount} <Link to="/auth/login">{t.login}</Link>
        </p>
      </div>
    </div>
  )
}
