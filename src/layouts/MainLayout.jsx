import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
