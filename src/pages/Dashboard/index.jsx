import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { Header } from '../../layouts/Header'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useApi } from '../../hooks/useApi'
import { dashboardService } from '../../services/dashboardService'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../utils/formatters'
import './Dashboard.css'


function GlobalGaugeChart({ data }) {
  const { theme } = useApp()
  const radialBgColor = theme === 'dark' ? '#0f172a' : '#f1f5f9'
  const radialData = [
    {
      name: '% Clientes Inad.',
      value: data.percentualClientes,
      fill: '#ef4444',
    },
    {
      name: '% Carteira em Risco',
      value: data.percentualValor,
      fill: '#f59e0b',
    },
    {
      name: '% Meta Recuperação',
      value: data.percentualMeta,
      fill: '#10b981',
    },
  ]

  return (
    <div className="global-gauge">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={30}
          outerRadius={85}
          barSize={16}
          data={radialData}
          startAngle={180}
          endAngle={-180}
        >
          <RadialBar
            minAngle={5}
            background={{ fill: radialBgColor }}
            clockWise
            dataKey="value"
            label={false}
          />
          <Tooltip
            formatter={(v) => `${v}%`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="gauge-legend">
        {radialData.map((item) => (
          <div key={item.name} className="gauge-legend-item">
            <span className="gauge-dot" style={{ background: item.fill }} />
            <div>
              <span className="gauge-legend-label">{item.name}</span>
              <span className="gauge-legend-value" style={{ color: item.fill }}>{item.value}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="gauge-totals">
        <div className="gauge-total-item">
          <span>Total Clientes</span>
          <strong>{data.totalClientes}</strong>
        </div>
        <div className="gauge-total-item">
          <span>Carteira Total</span>
          <strong>{formatCurrency(data.limiteCreditoTotal)}</strong>
        </div>
        <div className="gauge-total-item">
          <span>Meta do Mês</span>
          <strong>{formatCurrency(data.metaRecuperacao)}</strong>
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

export default function Dashboard() {
  const { data, loading } = useApi(() => dashboardService.getDashboard())
  const navigate = useNavigate()
  const { theme } = useApp()
  const chartGridColor = theme === 'dark' ? '#334155' : '#f1f5f9'

  if (loading || !data) {
    return (
      <>
        <Header title="Dashboard" subtitle="Visão executiva da carteira de inadimplência" />
        <div className="page-content">
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </>
    )
  }

  const { resumo, inadimplenciaGlobal, clientesPorFaixaAtraso, clientesPorStatus, evolucaoMensal, maioresDevedores } = data

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
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
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

        {/* Charts Row 1: Faixa combinado + % Global */}
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <Card padding={false}>
            <CardHeader
              title="Inadimplência por Faixa de Atraso"
              subtitle="Quantidade de clientes e valor em aberto"
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
              title="Inadimplência Global"
              subtitle="Percentuais sobre carteira total e meta"
            />
            <GlobalGaugeChart data={inadimplenciaGlobal} />
          </Card>
        </div>

        {/* Charts Row 2: Evolução + Status */}
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <Card padding={false}>
            <CardHeader title="Evolução Mensal" subtitle="Inadimplência x Recuperação (R$)" />
            <div style={{ padding: '0 16px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={formatShortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="inadimplencia" name="Inadimplência" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="recuperacao" name="Recuperação" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
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
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Maiores Devedores */}
        <Card padding={false}>
          <CardHeader title="Ranking dos Maiores Devedores" subtitle="Top 5 por valor em aberto" />
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
                {maioresDevedores.map((d, i) => (
                  <tr key={d.id} onClick={() => navigate(`/carteira/${d.id}`)} className="row-clickable">
                    <td>
                      <span className={`rank-badge rank-${i + 1}`}>{i + 1}º</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </>
  )
}
