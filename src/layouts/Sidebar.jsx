import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const FINANCEIRO_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/carteira', label: 'Carteira de Cobrança', icon: '📋' },
  { to: '/minha-fila', label: 'Minha Fila', icon: '⚡' },
  { to: '/titulos', label: 'Consulta de Títulos', icon: '🗂' },
  { to: '/juridico', label: 'Títulos Jurídico', icon: '⚖️' },
  { to: '/tratativas', label: 'Tratativas', icon: '💬' },
  { to: '/acordos', label: 'Acordos', icon: '🤝' },
  { to: '/relatorios', label: 'Relatórios', icon: '📊' },
]

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  const nomeUsuario = user?.nome || user?.username || ''
  const perfilUsuario = user?.perfil || ''

  const financeiroAtivo = FINANCEIRO_ITEMS.some((item) => location.pathname.startsWith(item.to))
  const [financeiroAberto, setFinanceiroAberto] = useState(financeiroAtivo)

  useEffect(() => {
    if (financeiroAtivo) setFinanceiroAberto(true)
  }, [financeiroAtivo])

  return (
    <aside className={[
      'sidebar',
      sidebarCollapsed ? 'sidebar-collapsed' : '',
      mobileSidebarOpen ? 'sidebar-mobile-open' : '',
    ].join(' ')}>
      <div className="sidebar-logo">
        {sidebarCollapsed ? (
          <img src="/logo-icon.png" alt="Setta" className="sidebar-logo-icon-img" />
        ) : (
          <div className="sidebar-logo-expanded">
            <img src="/logo-setta.png" alt="Setta" className="sidebar-logo-full-img" />
            <span className="sidebar-logo-name">Setta Flow</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!sidebarCollapsed && <span className="sidebar-section-label">MENU PRINCIPAL</span>}

        <NavLink
          to="/"
          end
          onClick={closeMobileSidebar}
          className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <span className="sidebar-item-icon">🏠</span>
          {!sidebarCollapsed && <span className="sidebar-item-label">Home</span>}
        </NavLink>

        <button
          type="button"
          className={`sidebar-item sidebar-item-toggle ${financeiroAtivo ? 'sidebar-item-active' : ''}`}
          onClick={() => setFinanceiroAberto((o) => !o)}
        >
          <span className="sidebar-item-icon">💰</span>
          {!sidebarCollapsed && (
            <>
              <span className="sidebar-item-label">Financeiro</span>
              <span className={`sidebar-item-chevron ${financeiroAberto ? 'sidebar-item-chevron-open' : ''}`}>▾</span>
            </>
          )}
        </button>

        {!sidebarCollapsed && financeiroAberto && (
          <div className="sidebar-submenu">
            {FINANCEIRO_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `sidebar-item sidebar-subitem ${isActive ? 'sidebar-item-active' : ''}`
                }
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        <NavLink
          to="/configuracoes"
          onClick={closeMobileSidebar}
          className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <span className="sidebar-item-icon">⚙</span>
          {!sidebarCollapsed && <span className="sidebar-item-label">Configurações</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className={`sidebar-avatar ${sidebarCollapsed ? 'sidebar-avatar-center' : ''}`}>
            {initials(nomeUsuario)}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{nomeUsuario}</span>
              {perfilUsuario && <span className="sidebar-user-role">{perfilUsuario}</span>}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
