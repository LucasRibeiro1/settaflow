import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationPanel } from '../components/notifications/NotificationPanel'
import './Header.css'

function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function Header({ title, subtitle, breadcrumb, actions }) {
  const { toggleSidebar, sidebarCollapsed, toggleMobileSidebar, mobileSidebarOpen, theme, toggleTheme } = useApp()

  function handleToggle() {
    if (window.innerWidth < 768) toggleMobileSidebar()
    else toggleSidebar()
  }
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const { total } = useNotifications()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={handleToggle} title="Menu">
          {mobileSidebarOpen ? '✕' : '☰'}
        </button>
        <div>
          {breadcrumb && <div className="header-breadcrumb">{breadcrumb}</div>}
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        {actions && <div className="header-actions">{actions}</div>}

        <button className="header-theme" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? '☀' : '🌙'}
        </button>

        <div className="header-notif-wrap">
          <button
            className={`header-notif ${notifOpen ? 'active' : ''}`}
            title="Notificações"
            onClick={() => setNotifOpen((v) => !v)}
          >
            🔔
            {total > 0 && <span className="notif-badge">{total > 9 ? '9+' : total}</span>}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <button className="header-logout" onClick={handleLogout} title="Sair do sistema">
          <span className="header-logout-text">Sair</span>
          <span className="header-logout-icon">⏻</span>
        </button>
        <div className="header-avatar" title={user?.nome || user?.username}>
          {initials(user?.nome || user?.username)}
        </div>
      </div>
    </header>
  )
}
