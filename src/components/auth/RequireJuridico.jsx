import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccessJuridico } from '../../utils/permissions'

export function RequireJuridico({ children }) {
  const { user } = useAuth()

  if (!canAccessJuridico(user)) {
    return <Navigate to="/" replace />
  }

  return children
}
