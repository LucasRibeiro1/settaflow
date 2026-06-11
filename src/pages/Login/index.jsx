import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    await login(username.trim(), password)
    // navegação feita pelo useEffect abaixo, após o estado ser commitado
  }

  return (
    <div className="login-page">
      <div className="login-panel-left">
        <div className="login-brand">
          <img src="/logo-setta.png" alt="Setta" className="login-logo" />
          <h1 className="login-brand-name">Setta Flow</h1>
          <p className="login-brand-sub">Sistema de Gestão de Cobrança</p>
        </div>
        <div className="login-panel-footer">
          <p>Acesso restrito a usuários autorizados.</p>
        </div>
        <img src="/login-pattern.png" alt="" className="login-panel-pattern" aria-hidden="true" />
      </div>

      <div className="login-panel-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Entrar na plataforma</h2>
            <p className="login-subtitle">Use suas credenciais do Protheus</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="username">Usuário</label>
              <input
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Senha</label>
              <div className="login-input-wrap">
                <input
                  id="password"
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-icon">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
