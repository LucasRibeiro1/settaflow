import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('setta_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('setta_theme', theme)
  }, [theme])

  const toggleSidebar = () => setSidebarCollapsed((v) => !v)
  const toggleMobileSidebar = () => setMobileSidebarOpen((v) => !v)
  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <AppContext.Provider value={{
      sidebarCollapsed, toggleSidebar,
      mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar,
      loading, setLoading, theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
