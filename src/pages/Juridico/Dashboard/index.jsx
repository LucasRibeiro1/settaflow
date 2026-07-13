import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { Header } from '../../../layouts/Header'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { useApi } from '../../../hooks/useApi'
import { useApp } from '../../../context/AppContext'
import { contratoService } from '../../../services/contratoService'
import { computeContratoDashboard } from '../../../utils/contratoStats'
import { formatDate } from '../../../utils/formatters'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { CONTRATO_STATUS_COLORS } from '../../../utils/contratoConstants'
import '../../Dashboard/Dashboard.css'

const EMPRESA_COLORS = { SEN: '#2563eb', SEE: '#f59e0b', SDL: '#8b5cf6' }
const TIPO_COLORS = ['#2563eb', '#10b981', '#f59e0b']
const STATUS_HEX = {
  em_analise: '#0ea5e9',
  analise_tecnica: '#8b5cf6',
  aprovacao: '#f59e0b',
  assinatura: '#f97316',
  vigente: '#10b981',
  vencido: '#ef4444',
  encerrado: '#94a3b8',
  reprovado: '#dc2626',
}

export default function JuridicoDashboard() {
  const navigate = useNavigate()
  const { theme } = useApp()
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const { data: contratos, loading } = useApi(() => contratoService.getContratos(), [])

  if (loading || !contratos) {
    return (
      <>
        <Header title="Jurídico" subtitle="Visão executiva de contratos" />
        <div className="page-content">
          <div className="grid grid-5" style={{ marginBottom: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </>
    )
  }

  const stats = computeContratoDashboard(contratos)

  const summaryCards = [
    { label: 'Total de Contratos', value: stats.total, sub: 'Todos os registros', icon: '📄', color: '#2563eb' },
    { label: 'Contratos Ativos', value: stats.ativos, sub: 'Em processo ou vigentes', icon: '⚙️', color: '#f59e0b' },
    { label: 'Contratos Vigentes', value: stats.vigentes, sub: 'Assinados e em vigor', icon: '✅', color: '#10b981' },
    { label: 'Contratos Vencidos', value: stats.vencidos, sub: 'Vigência expirada', icon: '⏰', color: '#ef4444' },
    { label: 'Vencendo em 30 dias', value: stats.vencendoEm30Dias.length, sub: 'Atenção necessária', icon: '⚠️', color: '#dc2626' },
  ]

  return (
    <>
      <Header title="Jurídico" subtitle="Visão executiva de contratos" />
      <div className="page-content fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div className="grid grid-5">
            {summaryCards.map((card) => (
              <div key={card.label} className="summary-card" style={{ borderLeft: `3px solid ${card.color}` }}>
                <div className="summary-card-top">
                  <span className="summary-icon">{card.icon}</span>
                  <span className="summary-label">{card.label}</span>
                </div>
                <div className="summary-value">{card.value}</div>
                <div className="summary-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-2">
            <Card padding={false}>
              <CardHeader title="Contratos por Empresa" subtitle="Quantidade de contratos por empresa do grupo" />
              <div style={{ padding: '0 16px 16px' }}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.porEmpresa} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="chave" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                      formatter={(v) => [v, 'Contratos']}
                    />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                      {stats.porEmpresa.map((e) => <Cell key={e.chave} fill={EMPRESA_COLORS[e.chave] || '#2563eb'} />)}
                      <LabelList dataKey="quantidade" position="top" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding={false}>
              <CardHeader title="Contratos por Tipo" subtitle="Cliente, Fornecedor ou Locação" />
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px 16px' }}>
                <ResponsiveContainer width="60%" height={210}>
                  <PieChart>
                    <Pie data={stats.porTipoContrato} dataKey="quantidade" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {stats.porTipoContrato.map((t, i) => <Cell key={t.chave} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {stats.porTipoContrato.map((t, i) => (
                    <div key={t.chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.label}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{t.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card padding={false}>
            <CardHeader title="Contratos por Status" subtitle="Distribuição no funil jurídico" />
            <div style={{ padding: '0 24px 20px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.porStatus} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} formatter={(v) => [v, 'Contratos']} />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={18}>
                    {stats.porStatus.map((s) => <Cell key={s.chave} fill={STATUS_HEX[s.chave] || '#2563eb'} />)}
                    <LabelList dataKey="quantidade" position="right" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-2">
            <Card padding={false}>
              <CardHeader title="Solicitações por Mês" subtitle="Volume de contratos solicitados" />
              <div style={{ padding: '0 16px 16px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.evolucaoMensal} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                    <Bar dataKey="quantidade" name="Solicitações" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding={false}>
              <CardHeader title="Seguro/Garantia e Prazo Médio" subtitle="Indicadores complementares" />
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Com Seguro/Garantia</span>
                  <Badge type="success">{stats.comSeguro}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sem Seguro/Garantia</span>
                  <Badge type="default">{stats.semSeguro}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tempo Médio de Assinatura</span>
                  <Badge type="info">{stats.tempoMedioAprovacao} dias</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contratos Encerrados</span>
                  <Badge type="default">{stats.encerrados}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contratos Reprovados</span>
                  <Badge type="danger">{stats.reprovados}</Badge>
                </div>
              </div>
            </Card>
          </div>

          <Card padding={false}>
            <CardHeader title="Contratos Vencendo em 30 Dias" subtitle="Priorize a renovação ou encerramento" />
            {stats.vencendoEm30Dias.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum contrato vigente vence nos próximos 30 dias.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Cliente/Fornecedor</th>
                      <th>Vencimento</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.vencendoEm30Dias.map((c) => (
                      <tr key={c.id} className="row-clickable" onClick={() => navigate('/juridico-contratos')}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.numero}</td>
                        <td style={{ fontWeight: 600 }}>{c.clienteNome}</td>
                        <td>
                          <Badge type={CONTRATO_STATUS_COLORS.vigente}>{formatDate(c.dataVencimento)}</Badge>
                        </td>
                        <td><button className="table-action-btn">Ver →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </>
  )
}
