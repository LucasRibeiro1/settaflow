import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▣', exact: true },
  { to: '/carteira', label: 'Carteira de Cobrança', icon: '📋' },
  { to: '/minha-fila', label: 'Minha Fila', icon: '⚡' },
  { to: '/titulos', label: 'Consulta de Títulos', icon: '🗂' },
  { to: '/tratativas', label: 'Tratativas', icon: '💬' },
  { to: '/acordos', label: 'Acordos', icon: '🤝' },
  { to: '/relatorios', label: 'Relatórios', icon: '📊' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙' },
]

export function Sidebar() {
  const { sidebarCollapsed } = useApp()
  const { user } = useAuth()
  const nomeUsuario = user?.nome || user?.username || ''
  const perfilUsuario = user?.perfil || ''

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {!sidebarCollapsed && <span className="sidebar-item-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!sidebarCollapsed && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials(nomeUsuario)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{nomeUsuario}</span>
              {perfilUsuario && <span className="sidebar-user-role">{perfilUsuario}</span>}
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="sidebar-avatar sidebar-avatar-center">{initials(nomeUsuario)}</div>
        )}
      </div>
    </aside>
  )
}
