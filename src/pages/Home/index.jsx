import { Header } from '../../layouts/Header'
import { useAuth } from '../../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const nome = user?.nome || user?.username || ''

  return (
    <>
      <Header title="Home" subtitle="Página inicial" />
      <div
        className="page-content fade-in"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Seja bem-vindo{nome ? `, ${nome}` : ''}!
        </h1>
      </div>
    </>
  )
}
