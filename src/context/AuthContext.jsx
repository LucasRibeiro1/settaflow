import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { setProtheusCredentials } from '../services/protheusApi'

const AuthContext = createContext(null)

const STORAGE_KEY = 'setta_auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.username && user?.password) {
      setProtheusCredentials(user.username, user.password)
    }
  }, [])

  async function login(username, password) {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.login(username, password)
      const session = {
        username,
        password,
        nome: data.nome || data.NOME || username,
        perfil: data.perfil || data.PERFIL || '',
      }
      setUser(session)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setProtheusCredentials(username, password)
      return true
    } catch (err) {
      const status = err.response?.status
      const apiMessage = err.apiMessage || null
      if (status === 401 || status === 403 || apiMessage) {
        setError(apiMessage || 'Usuário ou senha inválidos, ou sem permissão de acesso.')
      } else {
        setError('Erro ao conectar ao servidor. Tente novamente.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    setProtheusCredentials('API', 's&tt@')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
