import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { AppSwitcher } from '../components/common/AppSwitcher'
import './Sidebar.css'

function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const MENU_GROUPS = [
  {
    key: 'financeiro',
    label: 'Financeiro',
    icon: '💰',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '▣' },
      { to: '/carteira', label: 'Carteira de Cobrança', icon: '📋' },
      { to: '/minha-fila', label: 'Minha Fila', icon: '⚡' },
      { to: '/titulos', label: 'Consulta de Títulos', icon: '🗂' },
      { to: '/juridico', label: 'Títulos Jurídico', icon: '⚖️' },
      { to: '/tratativas', label: 'Tratativas', icon: '💬' },
      { to: '/acordos', label: 'Acordos', icon: '🤝' },
      { to: '/relatorios', label: 'Relatórios', icon: '📊' },
    ],
  },
  { key: 'juridico', label: 'Jurídico', icon: '🏛️', items: [] },
  { key: 'comercial', label: 'Comercial', icon: '🧭', items: [] },
]

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  const nomeUsuario = user?.nome || user?.username || ''
  const perfilUsuario = user?.perfil || ''

  const groupActiveMap = Object.fromEntries(
    MENU_GROUPS.map((g) => [g.key, g.items.some((item) => location.pathname.startsWith(item.to))])
  )
  const [openGroups, setOpenGroups] = useState(groupActiveMap)

  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false
      const next = { ...prev }
      for (const g of MENU_GROUPS) {
        if (groupActiveMap[g.key] && !prev[g.key]) {
          next[g.key] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className={[
      'sidebar',
      sidebarCollapsed ? 'sidebar-collapsed' : '',
      mobileSidebarOpen ? 'sidebar-mobile-open' : '',
    ].join(' ')}>
      <div className="sidebar-logo">
        {!sidebarCollapsed && <AppSwitcher />}
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

        {MENU_GROUPS.map((group) => (
          <div key={group.key}>
            <button
              type="button"
              className={`sidebar-item sidebar-item-toggle ${groupActiveMap[group.key] ? 'sidebar-item-active' : ''}`}
              onClick={() => toggleGroup(group.key)}
            >
              <span className="sidebar-item-icon">{group.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="sidebar-item-label">{group.label}</span>
                  <span className={`sidebar-item-chevron ${openGroups[group.key] ? 'sidebar-item-chevron-open' : ''}`}>▾</span>
                </>
              )}
            </button>

            {!sidebarCollapsed && openGroups[group.key] && (
              <div className="sidebar-submenu">
                {group.items.length > 0 ? (
                  group.items.map((item) => (
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
                  ))
                ) : (
                  <span className="sidebar-subitem sidebar-subitem-empty">Em breve</span>
                )}
              </div>
            )}
          </div>
        ))}

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
