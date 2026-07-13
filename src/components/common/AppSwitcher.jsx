import { useEffect, useRef, useState } from 'react'
import './AppSwitcher.css'

// Outras plataformas do Grupo Setta acessíveis a partir do SettaFlow
const APPS = [
  {
    name: 'Grupo Setta',
    description: 'Site institucional do Grupo Setta',
    url: 'https://gruposetta.com/',
    icon: '🌐',
  },
  {
    name: 'Portal BI',
    description: 'Indicadores e relatórios gerenciais do Grupo Setta',
    url: 'https://portalbi.gruposetta.com.br/',
    icon: '📊',
  },
  {
    name: 'Aprovador',
    description: 'Sistema de aprovações do Grupo Setta',
    url: 'https://app.aprovador.com/login',
    icon: '✅',
  },
]

export function AppSwitcher() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = APPS.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="app-switcher" ref={ref}>
      <button
        type="button"
        className="app-switcher-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Outras plataformas do Grupo Setta"
      >
        <span className="app-switcher-grid">
          <span /><span /><span /><span />
        </span>
      </button>

      {open && (
        <div className="app-switcher-panel">
          <input
            type="text"
            className="app-switcher-search"
            placeholder="Localizar aplicativos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <span className="app-switcher-label">APLICATIVOS</span>
          <div className="app-switcher-list">
            {filtered.map((app) => (
              <a
                key={app.name}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-switcher-item"
              >
                <span className="app-switcher-item-icon">{app.icon}</span>
                <span className="app-switcher-item-text">
                  <span className="app-switcher-item-name">{app.name} ↗</span>
                  <span className="app-switcher-item-desc">{app.description}</span>
                </span>
              </a>
            ))}
            {filtered.length === 0 && (
              <span className="app-switcher-empty">Nenhum aplicativo encontrado</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
