import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const colors = {
    success: { bg: '#ecfdf5', border: '#10b981', icon: '✓', text: '#065f46' },
    error: { bg: '#fef2f2', border: '#ef4444', icon: '✕', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠', text: '#92400e' },
    info: { bg: '#eff6ff', border: '#2563eb', icon: 'ℹ', text: '#1e40af' },
  }
  const c = colors[toast.type] || colors.info

  return (
    <div
      onClick={() => onRemove(toast.id)}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '380px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        animation: 'slideIn 0.2s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ color: c.border, fontWeight: 700, fontSize: '1rem' }}>{c.icon}</span>
      <span style={{ fontSize: '0.875rem', color: c.text, fontWeight: 500 }}>{toast.message}</span>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
