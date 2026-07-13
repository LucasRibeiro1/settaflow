import { useMemo, useState } from 'react'
import { Header } from '../../../layouts/Header'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Breadcrumb } from '../../../components/common/Breadcrumb'
import { useApi } from '../../../hooks/useApi'
import { useAuth } from '../../../context/AuthContext'
import { contratoService } from '../../../services/contratoService'
import { formatDate } from '../../../utils/formatters'
import {
  EMPRESA_LABELS, TIPO_CONTRATO_LABELS, CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS,
} from '../../../utils/contratoConstants'
import { ContratoDetalheModal } from '../Contratos/ContratoDetalheModal'
import '../Juridico.css'

const FILTROS_VENCIMENTO = [1, 5, 10, 20, 30]

function diasPendente(dataSolicitacao) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = new Date(`${dataSolicitacao}T00:00:00`)
  return Math.max(0, Math.round((hoje - d) / 86400000))
}

function diasParaVencer(dataVencimento) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = new Date(`${dataVencimento}T00:00:00`)
  return Math.round((d - hoje) / 86400000)
}

function prioridadeDe(dias) {
  if (dias > 30) return { label: 'Crítica', color: 'danger' }
  if (dias > 15) return { label: 'Alta', color: 'warning' }
  if (dias > 7) return { label: 'Média', color: 'info' }
  return { label: 'Baixa', color: 'success' }
}

export default function JuridicoMinhaFila() {
  const { user } = useAuth()
  const username = user?.nome || user?.username
  const [activeTab, setActiveTab] = useState('pendentes')
  const [filtroDias, setFiltroDias] = useState(30)
  const [contratoAtivo, setContratoAtivo] = useState(null)

  const { data: fila, loading: loadingFila, refetch: refetchFila } = useApi(() => contratoService.getMinhaFila(username), [username])
  const { data: todos, loading: loadingTodos, refetch: refetchTodos } = useApi(() => contratoService.getContratos(), [])

  const sorted = [...(fila || [])].sort((a, b) => diasPendente(b.dataSolicitacao) - diasPendente(a.dataSolicitacao))

  const vencendo = useMemo(() => {
    return (todos || [])
      .filter((c) => c.status === 'vigente' && c.dataVencimento && diasParaVencer(c.dataVencimento) >= 0 && diasParaVencer(c.dataVencimento) <= filtroDias)
      .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
  }, [todos, filtroDias])

  const refetchAtivo = () => { refetchFila(); refetchTodos(); setContratoAtivo(null) }

  return (
    <>
      <Header
        title="Minha Fila"
        subtitle="Contratos pendentes e vencimentos próximos"
        breadcrumb={<Breadcrumb items={[{ to: '/juridico-dashboard', label: 'Jurídico' }, { label: 'Minha Fila' }]} />}
      />
      <div className="page-content fade-in">

        <div className="tabs-bar" style={{ marginBottom: 16 }}>
          <button className={`tab-btn ${activeTab === 'pendentes' ? 'tab-active' : ''}`} onClick={() => setActiveTab('pendentes')}>
            Ação Pendente
            {fila?.length ? (
              <span style={{ marginLeft: 6, background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {fila.length}
              </span>
            ) : null}
          </button>
          <button className={`tab-btn ${activeTab === 'vencimentos' ? 'tab-active' : ''}`} onClick={() => setActiveTab('vencimentos')}>
            Vencimentos
            {vencendo.length ? (
              <span style={{ marginLeft: 6, background: 'var(--warning)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {vencendo.length}
              </span>
            ) : null}
          </button>
        </div>

        {activeTab === 'pendentes' && (
          loadingFila ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando fila...</div>
          ) : !sorted.length ? (
            <Card>
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '3rem', marginBottom: 12 }}>✅</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum contrato pendente pra você.</p>
                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  Contratos atribuídos a você em qualquer etapa de análise/aprovação aparecem aqui.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge type="danger">{sorted.filter((c) => diasPendente(c.dataSolicitacao) > 30).length} Críticos (+30d)</Badge>
                <Badge type="warning">{sorted.filter((c) => { const d = diasPendente(c.dataSolicitacao); return d > 15 && d <= 30 }).length} Alta (16-30d)</Badge>
                <Badge type="info">{sorted.filter((c) => { const d = diasPendente(c.dataSolicitacao); return d > 7 && d <= 15 }).length} Média (8-15d)</Badge>
                <Badge type="success">{sorted.filter((c) => diasPendente(c.dataSolicitacao) <= 7).length} Baixa (0-7d)</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sorted.map((c) => {
                  const dias = diasPendente(c.dataSolicitacao)
                  const prioridade = prioridadeDe(dias)
                  return (
                    <Card key={c.id} hoverable>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{c.numero}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{EMPRESA_LABELS[c.empresa]}</span>
                            <Badge type={CONTRATO_STATUS_COLORS[c.status] || 'default'}>{CONTRATO_STATUS_LABELS[c.status]}</Badge>
                            <Badge type={prioridade.color}>{prioridade.label}</Badge>
                          </div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.clienteNome}</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, auto))', gap: '10px 28px', marginTop: 10 }}>
                            {[
                              ['Tipo de Contrato', TIPO_CONTRATO_LABELS[c.tipoContrato]],
                              ['Solicitante', c.solicitante],
                              ['Data de Solicitação', formatDate(c.dataSolicitacao)],
                              ['Dias Pendente', `${dias}d`],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                                <p style={{ fontWeight: 600, fontSize: '0.825rem', marginTop: 2 }}>{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setContratoAtivo(c)}>
                          📁 Abrir Portal Contratos
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )
        )}

        {activeTab === 'vencimentos' && (
          <>
            <Card className="mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Vence em até:</span>
                {FILTROS_VENCIMENTO.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFiltroDias(d)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      border: filtroDias === d ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: filtroDias === d ? 'var(--primary)' : 'var(--surface)',
                      color: filtroDias === d ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: filtroDias === d ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {d} {d === 1 ? 'dia' : 'dias'}
                  </button>
                ))}
              </div>
            </Card>

            {loadingTodos ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando vencimentos...</div>
            ) : !vencendo.length ? (
              <Card>
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '3rem', marginBottom: 12 }}>📅</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Nenhum contrato vigente vence em até {filtroDias} {filtroDias === 1 ? 'dia' : 'dias'}.
                  </p>
                </div>
              </Card>
            ) : (
              <Card padding={false}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Empresa</th>
                        <th>Cliente/Fornecedor</th>
                        <th>Tipo</th>
                        <th>Vencimento</th>
                        <th>Dias Restantes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vencendo.map((c) => {
                        const dias = diasParaVencer(c.dataVencimento)
                        return (
                          <tr key={c.id} className="row-clickable" onClick={() => setContratoAtivo(c)}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.numero}</td>
                            <td>{EMPRESA_LABELS[c.empresa]}</td>
                            <td style={{ fontWeight: 600 }}>{c.clienteNome}</td>
                            <td>{TIPO_CONTRATO_LABELS[c.tipoContrato]}</td>
                            <td>{formatDate(c.dataVencimento)}</td>
                            <td>
                              <Badge type={dias <= 5 ? 'danger' : dias <= 15 ? 'warning' : 'info'}>{dias}d</Badge>
                            </td>
                            <td><button className="table-action-btn">Abrir →</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <ContratoDetalheModal
        contrato={contratoAtivo}
        onClose={() => setContratoAtivo(null)}
        onChanged={refetchAtivo}
        usuarioAtual={username}
      />
    </>
  )
}
