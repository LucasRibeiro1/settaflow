import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Breadcrumb } from '../../components/common/Breadcrumb'

const RELATORIOS = [
  { icon: '📋', title: 'Carteira de Inadimplência', desc: 'Listagem completa de clientes inadimplentes com saldos e atrasos.', category: 'Cobrança' },
  { icon: '📈', title: 'Evolução da Inadimplência', desc: 'Acompanhamento mensal do crescimento ou redução da carteira.', category: 'Análise' },
  { icon: '💰', title: 'Recuperação de Crédito', desc: 'Valores recuperados por período, responsável e status.', category: 'Financeiro' },
  { icon: '🤝', title: 'Acordos Realizados', desc: 'Relatório de acordos firmados, cumpridos e quebrados.', category: 'Acordos' },
  { icon: '💬', title: 'Produtividade da Equipe', desc: 'Quantidade de tratativas por usuário no período selecionado.', category: 'Gestão' },
  { icon: '⚠️', title: 'Clientes Críticos', desc: 'Clientes com maior atraso e sem contato recente.', category: 'Risco' },
  { icon: '📅', title: 'Promessas de Pagamento', desc: 'Controle de promessas cumpridas e descumpridas.', category: 'Cobrança' },
  { icon: '🗺️', title: 'Inadimplência por Região', desc: 'Distribuição geográfica da carteira de cobrança.', category: 'Análise' },
]

export default function Relatorios() {
  return (
    <>
      <Header
        title="Relatórios"
        subtitle="Relatórios gerenciais e analíticos"
        breadcrumb={<Breadcrumb items={[{ to: '/', label: 'Dashboard' }, { label: 'Relatórios' }]} />}
      />
      <div className="page-content fade-in">
        <div className="grid grid-4">
          {RELATORIOS.map((r) => (
            <Card key={r.title} hoverable style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '2rem' }}>{r.icon}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'var(--primary-50)',
                    color: 'var(--primary)',
                    padding: '2px 8px',
                    borderRadius: 20,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {r.category}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{r.title}</h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.desc}</p>
                </div>
                <button style={{
                  marginTop: 4,
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  transition: 'var(--transition)',
                }}>
                  Gerar Relatório →
                </button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: '16px 24px', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary-100)' }}>
          <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 500 }}>
            ℹ️ Os relatórios estarão disponíveis após integração com a API REST. Em modo de desenvolvimento, os dados são simulados.
          </p>
        </div>
      </div>
    </>
  )
}
