import { NavLink, Outlet } from 'react-router'
import { useLocale } from '../hooks/useLocale'
import { useProgressSync } from '../hooks/useProgressSync'
import styles from './Layout.module.css'

export function Layout() {
  const t = useLocale()
  useProgressSync()
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.logo}>Tavuilu</span>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            {t.home}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            {t.settings}
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
