import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, PieChart, Pie, Cell, Legend, BarChart,
} from 'recharts'
import { Header } from '../../layouts/Header'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useApi } from '../../hooks/useApi'
import { dashboardService } from '../../services/dashboardService'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../utils/formatters'
import './Dashboard.css'

function ComposicaoCarteiraChart({ composicaoCarteira, percInadimplencia }) {
  const formatShort = (v) => {
    if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
    return formatCurrency(v)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={composicaoCarteira}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            dataKey="value"
            paddingAngle={3}
          >
            {composicaoCarteira.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {composicaoCarteira.map((item) => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.fill, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.fill }}>{formatShort(item.value)}</span>
          </div>
        ))}
        <div style={{
          marginTop: 4,
          padding: '8px 12px',
          background: 'var(--bg)',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            % Inadimplência
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>
            {percInadimplencia}%
          </span>
        </div>
      </div>
    </div>
  )
}

function CustomTooltipFaixa({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.dataKey === 'valor' ? formatCurrency(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function CustomTooltipCurrency({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

const RANK_PAGE_SIZE = 10


export default function Dashboard() {
  const { data, loading } = useApi(() => dashboardService.getDashboard())
  const navigate = useNavigate()
  const { theme } = useApp()
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const [rankPage, setRankPage] = useState(1)

  if (loading || !data) {
    return (
      <>
        <Header title="Dashboard" subtitle="Visão executiva da carteira de inadimplência" />
        <div className="page-content">
          <div className="grid grid-5" style={{ marginBottom: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </>
    )
  }

  const {
    resumo, composicaoCarteira, percInadimplencia,
    clientesPorFaixaAtraso, clientesPorStatus, evolucaoMensal, maioresDevedores, todosDevedores,
  } = data
  const saldoTotalJuridico = resumo.saldoTotalJuridico ?? 0

  const rankTotal = todosDevedores?.length ?? 0
  const rankTotalPages = Math.ceil(rankTotal / RANK_PAGE_SIZE)
  const rankData = (todosDevedores ?? []).slice(
    (rankPage - 1) * RANK_PAGE_SIZE,
    rankPage * RANK_PAGE_SIZE,
  )

  const summaryCards = [
    {
      label: 'Clientes Inadimplentes',
      value: resumo.totalClientesInadimplentes,
      sub: 'Total na carteira',
      icon: '👥',
      color: 'danger',
      onClick: () => navigate('/carteira'),
    },
    {
      label: 'Total a Receber',
      value: formatCurrency(resumo.saldoTotalAberto),
      sub: 'Saldo total em aberto',
      icon: '💰',
      color: 'warning',
    },
    {
      label: 'Total Vencido',
      value: formatCurrency(resumo.saldoTotalVencido),
      sub: 'Saldo total vencido',
      icon: '⏰',
      color: 'danger',
      onClick: () => navigate('/titulos'),
    },
    {
      label: 'Jurídico',
      value: formatCurrency(saldoTotalJuridico),
      sub: 'Saldo em cobrança jurídica',
      icon: '⚖️',
      color: 'danger',
      onClick: () => navigate('/titulos'),
    },
    {
      label: 'Títulos Vencidos',
      value: resumo.totalTitulosVencidos,
      sub: 'Total de documentos',
      icon: '📄',
      color: 'info',
    },
  ]

  const formatShortCurrency = (v) => {
    if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
    return formatCurrency(v)
  }

  return (
    <>
      <Header title="Dashboard" subtitle="Visão executiva da carteira de inadimplência" />
      <div className="page-content fade-in">

        {/* Summary Cards */}
        <div className="grid grid-5" style={{ marginBottom: 24 }}>
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className={`summary-card summary-card-${card.color} ${card.onClick ? 'summary-card-link' : ''}`}
              onClick={card.onClick}
            >
              <div className="summary-card-top">
                <span className="summary-icon">{card.icon}</span>
                <span className="summary-label">{card.label}</span>
              </div>
              <div className="summary-value">{card.value}</div>
              <div className="summary-sub">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Linha 1: Aging de Clientes + Composição da Carteira */}
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <Card padding={false}>
            <CardHeader
              title="Aging de Clientes"
              subtitle="Quantidade de clientes e valor em aberto por faixa"
            />
            <div style={{ padding: '0 16px 16px' }}>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={clientesPorFaixaAtraso} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="faixa" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatShortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltipFaixa />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="quantidade" name="Clientes" radius={[4, 4, 0, 0]} fill="#2563eb" />
                  <Line yAxisId="right" type="monotone" dataKey="valor" name="Valor (R$)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader
              title="Composição da Carteira"
              subtitle="Total a Receber vs Total Vencido"
            />
            <ComposicaoCarteiraChart
              composicaoCarteira={composicaoCarteira || []}
              percInadimplencia={percInadimplencia || 0}
            />
          </Card>
        </div>

        {/* Linha 2: Histórico + Status */}
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <Card padding={false}>
            <CardHeader
              title="Histórico de Contas a Receber em Atraso"
              subtitle="Barras: saldo do mês · Linha: acumulado (data reprogramada)"
            />
            <div style={{ padding: '0 16px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" tickFormatter={formatShortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatShortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltipCurrency />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="saldoMes" name="Saldo do Mês" fill="#f59e0b" opacity={0.75} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="saldoVencido" name="Acumulado" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader title="Clientes por Status de Cobrança" subtitle="Distribuição atual" />
            <div style={{ padding: '0 16px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={clientesPorStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="quantidade"
                    nameKey="status"
                    paddingAngle={3}
                  >
                    {clientesPorStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top 10 — barras horizontais largura total */}
        <Card padding={false} style={{ marginBottom: 24 }}>
          <CardHeader
            title="Top 10 Maiores Devedores"
            subtitle="Saldo em aberto por cliente — clique na barra para ver detalhes"
          />
          <div style={{ padding: '0 24px 20px' }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={maioresDevedores}
                barSize={18}
                margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                <XAxis type="number" tickFormatter={formatShortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="nome" width={260} tick={{ fontSize: 9.5, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                        <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{d.nome}</p>
                        <p style={{ color: '#ef4444' }}>Saldo: <strong>{formatCurrency(d.valor)}</strong></p>
                        <p style={{ color: '#94a3b8', marginTop: 2 }}>Maior atraso: {d.diasAtraso} dias</p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="valor"
                  name="Saldo em Aberto"
                  radius={[0, 6, 6, 0]}
                  onClick={(d) => navigate(`/carteira/${d.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {maioresDevedores.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#dc2626' : i === 1 ? '#ef4444' : i <= 3 ? '#f97316' : '#2563eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ranking tabela — todos os devedores, 10 por página */}
        <Card padding={false}>
          <CardHeader
            title="Ranking de Devedores"
            subtitle={`${rankTotal} clientes com títulos vencidos em aberto · página ${rankPage} de ${rankTotalPages}`}
          />
          <div className="devedores-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Maior Atraso</th>
                  <th>Valor em Aberto</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {rankData.map((d, i) => {
                  const pos = (rankPage - 1) * RANK_PAGE_SIZE + i + 1
                  return (
                    <tr key={d.id} onClick={() => navigate(`/carteira/${d.id}`)} className="row-clickable">
                      <td>
                        <span className={`rank-badge rank-${Math.min(pos, 3)}`}>{pos}º</span>
                      </td>
                      <td className="devedor-nome">{d.nome}</td>
                      <td>
                        <Badge type={d.diasAtraso > 120 ? 'danger' : d.diasAtraso > 60 ? 'warning' : 'info'}>
                          {d.diasAtraso} dias
                        </Badge>
                      </td>
                      <td className="devedor-valor">{formatCurrency(d.valor)}</td>
                      <td>
                        <button className="table-action-btn">Ver detalhes →</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rankTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                className="table-action-btn"
                onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                disabled={rankPage === 1}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {rankPage} / {rankTotalPages}
              </span>
              <button
                className="table-action-btn"
                onClick={() => setRankPage((p) => Math.min(rankTotalPages, p + 1))}
                disabled={rankPage === rankTotalPages}
              >
                Próximo →
              </button>
            </div>
          )}
        </Card>

      </div>
    </>
  )
}