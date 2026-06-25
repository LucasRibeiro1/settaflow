import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../layouts/Header'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { useApi } from '../../hooks/useApi'
import { clienteService } from '../../services/clienteService'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters'
import { ResumoTab } from './tabs/ResumoTab'
import { FinanceiroTab } from './tabs/FinanceiroTab'
import { TratativasTab } from './tabs/TratativasTab'
import { AcordosTab } from './tabs/AcordosTab'
import './Cliente.css'

const TABS = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'tratativas', label: 'Tratativas' },
  { key: 'acordos', label: 'Acordos' },
]

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('resumo')

  const { data: cliente, loading } = useApi(() => clienteService.getClienteById(id), [id])

  if (loading || !cliente) {
    return (
      <>
        <Header title="Carregando..." />
        <div className="page-content">
          <div className="cliente-loading">Carregando dados do cliente...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title={cliente.nomeFantasia || cliente.razaoSocial}
        subtitle={`${cliente.codigo}${cliente.loja ? `-${cliente.loja}` : ''} · ${cliente.cidade}/${cliente.uf}`}
        breadcrumb={
          <Breadcrumb items={[
            { to: '/', label: 'Dashboard' },
            { to: '/carteira', label: 'Carteira' },
            { label: cliente.nomeFantasia || cliente.razaoSocial },
          ]} />
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/carteira')}>← Voltar</Button>
            <Badge type={STATUS_COLORS[cliente.statusCobranca] || 'default'} size="lg">
              {STATUS_LABELS[cliente.statusCobranca] || cliente.statusCobranca}
            </Badge>
          </div>
        }
      />
      <div className="page-content fade-in">

        {/* KPI Row */}
        <div className="cliente-kpi-row">
          <div className="cliente-kpi">
            <span className="kpi-label">Valor em Aberto</span>
            <span className="kpi-value kpi-danger">{formatCurrency(cliente.valorTotalAberto)}</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Títulos Vencidos</span>
            <span className="kpi-value">{cliente.qtdTitulosVencidos}</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Maior Atraso</span>
            <span className="kpi-value kpi-danger">{cliente.maiorAtraso} dias</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Último Pagamento</span>
            <span className="kpi-value">{formatDate(cliente.ultimoPagamento)}</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Última Compra</span>
            <span className="kpi-value">{formatDate(cliente.ultimaCompra)}</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Último Contato</span>
            <span className="kpi-value">{formatDate(cliente.ultimoContato)}</span>
          </div>
          <div className="cliente-kpi">
            <span className="kpi-label">Próxima Ação</span>
            <span className="kpi-value kpi-info kpi-small">{cliente.proximaAcao}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? 'tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {tab === 'resumo' && <ResumoTab cliente={cliente} />}
          {tab === 'financeiro' && <FinanceiroTab clienteId={id} cliente={cliente} />}
          {tab === 'tratativas' && <TratativasTab clienteId={id} cliente={cliente} />}
          {tab === 'acordos' && <AcordosTab clienteId={id} cliente={cliente} />}
        </div>

      </div>
    </>
  )
}
