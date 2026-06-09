import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { useLocale } from '../../hooks/useLocale'
import { authClient } from '../../lib/auth-client'
import styles from './AuthForm.module.css'

export function RegisterPage() {
  const t = useLocale()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signUpError } = await authClient.signUp.email({ name, email, password })
    setSubmitting(false)
    if (signUpError) {
      setError(t.registerError)
      return
    }
    navigate('/settings')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t.register}</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">{t.name}</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

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
