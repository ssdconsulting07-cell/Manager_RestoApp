import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ROLE_LABELS } from '../auth/roles.js'
import { useAuth } from '../auth/AuthContext.jsx'
import Toast from './Toast.jsx'
import '../styles/manager.css'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '▣', roles: ['CUISINE', 'GERANT', 'MANAGER', 'LIVREUR'] },
  { path: '/commandes', label: 'Commandes', icon: '◫', roles: ['CUISINE'] },
  { path: '/preparation', label: 'Préparation', icon: '◧', roles: ['CUISINE'] },
  { path: '/menu', label: 'Menu', icon: '☰', roles: ['GERANT'] },
  { path: '/statistiques', label: 'Statistiques', icon: '◔', roles: ['MANAGER'] },
  { path: '/personnel', label: 'Personnel', icon: '◎', roles: ['MANAGER'] },
  { path: '/livraisons', label: 'Livraisons', icon: '⇢', roles: ['LIVREUR'] },
]

function initials(username, role) {
  const parts = username.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return (parts[0]?.slice(0, 2) || ROLE_LABELS[role]?.slice(0, 2) || 'SU').toUpperCase()
}

function formatLastConnection(timestamp) {
  if (!timestamp) return 'Première connexion'

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'À l’instant'
  if (elapsedMinutes < 60) return `Il y a ${elapsedMinutes} min`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `Il y a ${elapsedHours} h`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return elapsedDays === 1 ? 'Hier' : `Il y a ${elapsedDays} jours`
}

  function BellIcon() {
    return (
      <svg className="manager-header-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 17h12l-1.2-1.7V10a4.8 4.8 0 0 0-9.6 0v5.3L6 17Z" />
        <path d="M10 20h4" />
      </svg>
    )
  }

  function MoonIcon() {
    return (
      <svg className="manager-header-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.2 14.7A7.6 7.6 0 0 1 9.3 4.8 7.7 7.7 0 1 0 19.2 14.7Z" />
      </svg>
    )
  }

  function SunIcon() {
    return (
      <svg className="manager-header-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.3" />
        <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  }

function NotificationIcon() {
  return (
    <svg className="manager-notification-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 17h12l-1.2-1.7V10a4.8 4.8 0 0 0-9.6 0v5.3L6 17Z" />
      <path d="M10 20h4" />
    </svg>
  )
}

const INITIAL_NOTIFICATIONS = [
  { id: 1, kind: 'crown', title: 'Nouveau service', text: 'Une nouvelle information concerne votre espace de travail et vous aide à prioriser votre activité de la journée.', time: 'À l’instant', target: '/commandes', unread: true },
  { id: 2, kind: 'assignment', title: 'Activité de votre équipe', text: 'Une action récente nécessite votre attention, notamment la validation de livraisons en attente et les changements de statut.', time: 'Il y a 3 h', target: '/livraisons', unread: true },
  { id: 3, kind: 'status', title: 'Mise à jour du service', text: 'Le statut d’une opération vient d’être actualisé et les équipes ont été informées du changement.', time: 'Hier', target: '/statistiques', unread: false },
  { id: 4, kind: 'crown', title: 'Priorité de la journée', text: 'Le planning de service a été revu. Consultez les tâches urgentes avant la prochaine tournée.', time: 'Il y a 1 j', target: '/dashboard', unread: true },
  { id: 5, kind: 'status', title: 'Validation nécessaire', text: 'Une demande de validation est en attente dans votre espace pour éviter tout retard sur la préparation.', time: 'Il y a 2 j', target: '/preparation', unread: false },
]

const SIDEBAR_COLLAPSED_KEY = 'senyummies_manager_sidebar_collapsed'
const NOTIFICATIONS_PER_PAGE = 3

function ChangePasswordModal({ onClose, onNotice }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function submit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      onNotice('error', 'Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    onNotice('error', 'Le changement de mot de passe sera connecté à l’API prochainement.')
    onClose()
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Sécurité du compte</p>
            <h2 id="password-modal-title">Changer le mot de passe</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        <form className="manager-modal-form" onSubmit={submit}>
          <label>
            Mot de passe actuel
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </label>
          <label>
            Nouveau mot de passe
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </label>
          <label>
            Confirmer le nouveau mot de passe
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </label>
          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
              Enregistrer
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function Layout({ children }) {
  const { role, username, lastLoginAt, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [notificationPage, setNotificationPage] = useState(0)
  const [expandedNotificationIds, setExpandedNotificationIds] = useState([])
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('senyummies_manager_theme') === 'dark')
  const [now, setNow] = useState(() => new Date())
  const [toast, setToast] = useState(null)

  function toggleSidebar() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setCollapsed(false)
      setMobileOpen((current) => !current)
      return
    }
    setCollapsed((current) => !current)
  }

  useEffect(() => {
    localStorage.setItem('senyummies_manager_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function closeOnEscape(e) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
        setPasswordOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const unreadNotifications = notifications.filter((notification) => notification.unread)

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
  const formattedTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(now)
  const lastConnection = formatLastConnection(lastLoginAt)

  function showNotice(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  function markNotificationsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))
  }

  function dismissNotification(id) {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
    setExpandedNotificationIds((current) => current.filter((notificationId) => notificationId !== id))
  }

  function toggleNotification(id) {
    setExpandedNotificationIds((current) =>
      current.includes(id) ? current.filter((notificationId) => notificationId !== id) : [...current, id]
    )
  }

  function unreadFor(path) {
    return unreadNotifications.filter((notification) => notification.target === path).length
  }

  const totalNotificationPages = Math.max(1, Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE))
  const visibleNotifications = notifications.slice(
    notificationPage * NOTIFICATIONS_PER_PAGE,
    (notificationPage + 1) * NOTIFICATIONS_PER_PAGE
  )

  useEffect(() => {
    if (notificationPage >= totalNotificationPages) {
      setNotificationPage(totalNotificationPages - 1)
    }
  }, [notificationPage, totalNotificationPages])

  return (
    <div className={`manager-shell ${darkMode ? 'is-dark' : ''} ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <aside className="manager-sidebar" aria-label="Navigation principale">
        <div className="manager-sidebar-brand">
          <span className="manager-brand-full">SEN<span>YUMMIES</span></span>
          <span className="manager-brand-short">SY</span>
          <button className="manager-collapse-button" type="button" aria-label={mobileOpen ? 'Fermer la navigation' : 'Réduire la navigation'} onClick={toggleSidebar}>
            {mobileOpen ? '‹' : collapsed ? '›' : '‹'}
          </button>
        </div>
        <div className="manager-role-block">
          <p>ESPACE PERSONNEL</p>
          <strong>{ROLE_LABELS[role]}</strong>
        </div>
        <nav className="manager-nav">
          {visibleItems.map((item) => (
            <NavLink
              className={({ isActive }) => `manager-nav-link ${isActive ? 'is-active' : ''}`}
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className="manager-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="manager-nav-label">{item.label}</span>
              {unreadFor(item.path) > 0 && <span className="manager-nav-badge">{unreadFor(item.path)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="manager-sidebar-footer">
          <button className="manager-nav-link manager-logout-link" type="button" onClick={logout}>
            <span className="manager-nav-icon" aria-hidden="true">↪</span>
            <span className="manager-nav-label">Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="manager-main">
        <header className="manager-header">
          <button className="manager-mobile-menu" type="button" aria-label="Ouvrir la navigation" onClick={() => setMobileOpen(true)}>☰</button>
          <div className="manager-header-context">
            <div className="manager-header-stat">
              <span className="manager-header-stat-label">Aujourd’hui</span>
              <strong className="manager-header-stat-value is-date">{formattedDate} · {formattedTime}</strong>
            </div>
            <div className="manager-header-divider" aria-hidden="true" />
            <div className="manager-header-stat">
              <span className="manager-header-stat-label">Dernière connexion</span>
              <strong className="manager-header-stat-value">{lastConnection}</strong>
            </div>
          </div>
          <div className="manager-header-actions">
              <div className="manager-notification-wrap">
                <button className="manager-header-action" type="button" aria-label={`${unreadNotifications.length} notifications non lues`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((current) => !current); setProfileOpen(false) }}>
                  <BellIcon />
                  {unreadNotifications.length > 0 && <span className="manager-notification-badge">{unreadNotifications.length}</span>}
                </button>
                {notificationsOpen && (
                  <div className="manager-notification-menu">
                    <div className="manager-notification-heading">
                      <h2>Notifications</h2>
                      <div className="manager-notification-header-actions">
                        <button type="button" onClick={markNotificationsRead}>Tout marquer lu</button>
                        <button className="manager-notification-close-panel" type="button" aria-label="Fermer les notifications" onClick={() => setNotificationsOpen(false)}>×</button>
                      </div>
                    </div>
                    <div className="manager-notification-list">
                      {visibleNotifications.length === 0 ? (
                        <div className="manager-notification-empty">Aucune notification.</div>
                      ) : (
                        visibleNotifications.map((notification) => {
                          const isExpanded = expandedNotificationIds.includes(notification.id)
                          const isLong = notification.text.length > 90

                          return (
                            <div className={`manager-notification-item ${notification.unread ? 'is-unread' : ''}`} key={notification.id}>
                              <button
                                className="manager-notification-main"
                                type="button"
                                onClick={() => {
                                  setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, unread: false } : item))
                                  if (isLong) toggleNotification(notification.id)
                                }}
                              >
                                <span className="manager-notification-symbol"><NotificationIcon kind={notification.kind} /></span>
                                <span className="manager-notification-copy">
                                  <strong>{notification.title}</strong>
                                  <span className={isExpanded ? 'is-expanded' : ''}>{notification.text}</span>
                                  {isLong && (
                                    <button className="manager-notification-toggle" type="button" onClick={(event) => {
                                      event.stopPropagation()
                                      toggleNotification(notification.id)
                                    }}>
                                      {isExpanded ? 'Voir moins' : 'Voir plus'}
                                    </button>
                                  )}
                                  <small>{notification.time}</small>
                                </span>
                              </button>
                              <button className="manager-notification-close" type="button" aria-label="Fermer la notification" onClick={() => dismissNotification(notification.id)}>×</button>
                            </div>
                          )
                        })
                      )}
                    </div>
                    {notifications.length > NOTIFICATIONS_PER_PAGE && (
                      <div className="manager-notification-pagination">
                        <button type="button" disabled={notificationPage === 0} onClick={() => setNotificationPage((current) => Math.max(0, current - 1))}>
                          Précédent
                        </button>
                        <span>{notificationPage + 1}/{totalNotificationPages}</span>
                        <button type="button" disabled={notificationPage >= totalNotificationPages - 1} onClick={() => setNotificationPage((current) => Math.min(totalNotificationPages - 1, current + 1))}>
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            <button className="manager-header-action" type="button" aria-label={darkMode ? 'Activer le thème clair' : 'Activer le thème sombre'} onClick={() => setDarkMode((current) => !current)}>
                {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          <div className="manager-profile-wrap">
            <button className="manager-profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((current) => !current)}>
              <span className="manager-avatar">{initials(username, role)}</span>
            </button>
            {profileOpen && (
              <div className="manager-profile-menu">
                <button type="button" onClick={() => { setPasswordOpen(true); setProfileOpen(false) }}>Changer le mot de passe</button>
                <button className="is-danger" type="button" onClick={logout}>Déconnexion</button>
              </div>
            )}
          </div>
          </div>
        </header>
        <main className="manager-workarea">{children}</main>
        <footer className="manager-workarea-footer">© SSD Consulting</footer>
      </div>
      {mobileOpen && <button className="manager-mobile-backdrop" aria-label="Fermer la navigation" type="button" onClick={() => setMobileOpen(false)} />}
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onNotice={showNotice} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}