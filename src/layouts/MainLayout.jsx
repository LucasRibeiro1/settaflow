import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useApp } from '../context/AppContext'

export function MainLayout() {
  const { mobileSidebarOpen, closeMobileSidebar } = useApp()

  return (
    <div className="app-wrapper">
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
