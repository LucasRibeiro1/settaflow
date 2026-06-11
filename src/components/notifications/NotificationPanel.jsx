import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import './NotificationPanel.css'

export function NotificationPanel({ open, onClose }) {
  const { items, total, loading } = useNotifications()
  const panelRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  const urgent  = items.filter((i) => i.urgent)
  const normal  = items.filter((i) => !i.urgent)

  function handleItem(link) {
    onClose()
    navigate(link)
  }

  return (
    <div className="notif-panel" ref={panelRef}>
      <div className="notif-panel-header">
        <span className="notif-panel-title">Notificações</span>
        {total > 0 && <span className="notif-panel-count">{total}</span>}
      </div>

      {loading && (
        <div className="notif-panel-empty">Carregando...</div>
      )}

      {!loading && total === 0 && (
        <div className="notif-panel-empty">
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <p>Nenhuma pendência no momento</p>
        </div>
      )}

      {!loading && urgent.length > 0 && (
        <div className="notif-section">
          <span className="notif-section-label urgent">Urgentes</span>
          {urgent.map((item) => (
            <button key={item.id} className="notif-item notif-item-urgent" onClick={() => handleItem(item.link)}>
              <span className="notif-item-icon">{item.icon}</span>
              <div className="notif-item-body">
                <p className="notif-item-title">{item.title}</p>
                <p className="notif-item-sub">{item.subtitle}</p>
                {item.detail && <p className="notif-item-detail">{item.detail}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && normal.length > 0 && (
        <div className="notif-section">
          <span className="notif-section-label">Hoje</span>
          {normal.map((item) => (
            <button key={item.id} className="notif-item" onClick={() => handleItem(item.link)}>
              <span className="notif-item-icon">{item.icon}</span>
              <div className="notif-item-body">
                <p className="notif-item-title">{item.title}</p>
                <p className="notif-item-sub">{item.subtitle}</p>
                {item.detail && <p className="notif-item-detail">{item.detail}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
