import { NavLink, Outlet } from 'react-router'
import styles from './Layout.module.css'

export function Layout() {
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
            Etusivu
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Asetukset
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
