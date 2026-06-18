import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { useApi } from '../../hooks/useApi'
import { usePagination } from '../../hooks/usePagination'
import { acordoService } from '../../services/acordoService'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate, ACORDO_STATUS_LABELS, ACORDO_STATUS_COLORS } from '../../utils/formatters'

const PAGE_SIZE = 10

export default function Acordos() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [filterStatus, setFilterStatus] = useState('')

  const { data: acordos, loading, refetch } = useApi(
    () => acordoService.getAcordos(),
    []
  )

  const filtered = useMemo(() => {
    let result = acordos || []
    if (filterStatus) result = result.filter((a) => a.status === filterStatus)
    return result
  }, [acordos, filterStatus])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const promessasPendentes = (acordos || []).filter((a) => a.status === 'em_aberto').length
  const previsaoRecebimento = (acordos || [])
    .filter((a) => a.status === 'em_aberto')
    .reduce((s, a) => s + (a.valorNegociado || 0), 0)

  const handleUpdateStatus = async (id, status) => {
    try {
      await acordoService.updateAcordo(id, { status })
      addToast('Status atualizado.', 'success')
      refetch()
    } catch {
      addToast('Erro ao atualizar.', 'error')
    }
  }

  return (
    <>
      <Header
        title="Acordos"
        subtitle="Negociações e parcelamentos formalizados"
        breadcrumb={<Breadcrumb items={[{ to: '/', label: 'Dashboard' }, { label: 'Acordos' }]} />}
      />
      <div className="page-content fade-in">

        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          {[
            { label: 'Promessas Pendentes', value: promessasPendentes, sub: 'Acordos em aberto', icon: '🤝', color: '#8b5cf6' },
            { label: 'Previsão de Recebimento', value: formatCurrency(previsaoRecebimento), sub: 'Total a receber', icon: '📈', color: '#10b981' },
          ].map((card) => (
            <div key={card.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              borderLeft: `3px solid ${card.color}`,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </span>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{card.value}</span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <Card className="mb-16">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); goToPage(1) }} style={{ width: 220 }}>
              <option value="">Todos os status</option>
              {Object.entries(ACORDO_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            {filterStatus && (
              <Button variant="ghost" size="sm" onClick={() => setFilterStatus('')}>✕ Limpar</Button>
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤝</p>
                <p>Nenhum acordo encontrado.</p>
              </div>
            </Card>
          ) : (
            paginatedData.map((a) => (
              <Card key={a.id} hoverable>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/carteira/${a.clienteId}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit' }}
                      >
                        {a.clienteNome}
                      </button>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.clienteCodigo}</span>
                      <Badge type={ACORDO_STATUS_COLORS[a.status] || 'default'}>
                        {ACORDO_STATUS_LABELS[a.status]}
                      </Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: '16px 32px', width: 'fit-content' }}>
                      {[
                        ['Valor Negociado', formatCurrency(a.valorNegociado)],
                        ['Parcelas', `${a.qtdParcelas}x`],
                        ['Valor/Parcela', formatCurrency(a.valorNegociado / a.qtdParcelas)],
                        ['1ª Parcela', formatDate(a.vencimentoPrimeiraParcela)],
                        ['Data do Acordo', formatDate(a.dataAcordo)],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                          <p style={{ fontWeight: 600, fontSize: '0.825rem', marginTop: 2 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    {a.observacoes && (
                      <p style={{ marginTop: 10, fontSize: '0.775rem', color: 'var(--text-muted)' }}>{a.observacoes}</p>
                    )}
                  </div>
                  {a.status === 'em_aberto' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" variant="success" onClick={() => handleUpdateStatus(a.id, 'cumprido')}>✓ Cumprido</Button>
                      <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(a.id, 'quebrado')}>✕ Quebrado</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        )}
      </div>
    </>
  )
}
