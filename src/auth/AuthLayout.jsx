import { useEffect, useState } from 'react'
import AuthCarousel from './AuthCarousel.jsx'
import '../styles/auth.css'
import PiedDePage from '../components/PiedDePage.jsx'

export default function AuthLayout({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('senyummies_manager_theme') === 'dark')

  useEffect(() => {
    function syncTheme(event) {
      if (event.key === null || event.key === 'senyummies_manager_theme') {
        setIsDark(localStorage.getItem('senyummies_manager_theme') === 'dark')
      }
    }

    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  return (
    <main className={`auth-shell ${isDark ? 'is-dark' : ''}`}>
      <section className="auth-form-panel" aria-label="Connexion au personnel">
        <div className="auth-form-content">{children}</div>
        <PiedDePage className="auth-copyright" />
      </section>
      <AuthCarousel />
    </main>
  )
}