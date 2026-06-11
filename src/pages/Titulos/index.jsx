import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportToCSV, exportToPrint } from '../../utils/exportUtils'
import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import { tituloService } from '../../services/tituloService'
import { formatCurrency, formatDate } from '../../utils/formatters'

const PAGE_SIZE = 15

const FAIXA_OPTIONS = [
  { value: '', label: 'Todas as faixas' },
  { value: '1-30', label: '1 a 30 dias' },
  { value: '31-60', label: '31 a 60 dias' },
  { value: '61-90', label: '61 a 90 dias' },
  { value: '91-180', label: '91 a 180 dias' },
  { value: '+180', label: 'Acima de 180 dias' },
]

export default function ConsultaTitulos() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterFaixa, setFilterFaixa] = useState('')
  const [filterAtraso, setFilterAtraso] = useState('')
  const [filterGrupo, setFilterGrupo] = useState('')
  const [sortField, setSortField] = useState('diasAtraso')
  const [sortDir, setSortDir] = useState('desc')

  const debouncedSearch = useDebounce(search, 350)

  const { data, loading } = useApi(() => tituloService.getTitulos(), [])
  const allTitulos = data?.data || []

  // Grupos extraídos dinamicamente dos títulos carregados
  const grupoOptions = useMemo(() => {
    const unique = [...new Set(allTitulos.map((t) => t.grupoCliente).filter((g) => g && g !== '—'))].sort()
    return [
      { value: '', label: 'Todos os grupos' },
      ...unique.map((g) => ({ value: g, label: g })),
    ]
  }, [allTitulos])

  // Tipos extraídos dinamicamente da API
  const tipoOptions = useMemo(() => {
    const unique = [...new Set(allTitulos.map((t) => t.tipo).filter((t) => t && t !== '—'))].sort()
    return [
      { value: '', label: 'Todos os tipos' },
      ...unique.map((t) => ({ value: t, label: t })),
    ]
  }, [allTitulos])

  const filtered = useMemo(() => {
    let result = allTitulos
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (t) =>
          t.clienteNome.toLowerCase().includes(q) ||
          t.clienteCodigo.toLowerCase().includes(q) ||
          t.titulo.toLowerCase().includes(q)
      )
    }
    if (filterGrupo) result = result.filter((t) => t.grupoCliente === filterGrupo)
    if (filterTipo) result = result.filter((t) => t.tipo === filterTipo)
    if (filterAtraso === 'vencido') result = result.filter((t) => t.diasAtraso > 0)
    if (filterAtraso === 'no_prazo') result = result.filter((t) => t.diasAtraso === 0)
    if (filterFaixa) {
      const faixas = {
        '1-30':   (t) => t.diasAtraso >= 1 && t.diasAtraso <= 30,
        '31-60':  (t) => t.diasAtraso >= 31 && t.diasAtraso <= 60,
        '61-90':  (t) => t.diasAtraso >= 61 && t.diasAtraso <= 90,
        '91-180': (t) => t.diasAtraso >= 91 && t.diasAtraso <= 180,
        '+180':   (t) => t.diasAtraso > 180,
      }
      if (faixas[filterFaixa]) result = result.filter(faixas[filterFaixa])
    }
    result = [...result].sort((a, b) => {
      let va = a[sortField]
      let vb = b[sortField]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [allTitulos, debouncedSearch, filterGrupo, filterTipo, filterFaixa, filterAtraso, sortField, sortDir])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const totalSaldo = filtered.reduce((s, t) => s + t.saldoAtual, 0)
  const totalVencidos = filtered.filter((t) => t.diasAtraso > 0).length

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('desc') }
  }

  const sortIcon = (field) => (
    <span className="sort-icon" style={sortField === field ? { color: 'var(--primary)' } : {}}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const hasFilters = search || filterGrupo || filterTipo || filterFaixa || filterAtraso
  const clearFilters = () => { setSearch(''); setFilterGrupo(''); setFilterTipo(''); setFilterFaixa(''); setFilterAtraso('') }

  function handleExportCSV() {
    const headers = ['Título', 'Cliente', 'Código', 'Tipo', 'Vencimento', 'Dias Atraso', 'Saldo (R$)']
    const rows = filtered.map((t) => [
      t.titulo,
      t.clienteNome,
      t.clienteCodigo,
      t.tipo,
      formatDate(t.dataVencimento),
      t.diasAtraso,
      t.saldoAtual.toFixed(2).replace('.', ','),
    ])
    exportToCSV(headers, rows, 'titulos.csv')
  }

  function handleExportPDF() {
    exportToPrint('Consulta de Títulos')
  }

  return (
    <>
      <Header
        title="Consulta de Títulos"
        subtitle={`${filtered.length} títulos encontrados · Saldo total: ${formatCurrency(totalSaldo)}`}
        breadcrumb={<Breadcrumb items={[{ to: '/', label: 'Dashboard' }, { label: 'Consulta de Títulos' }]} />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExportCSV}>⬇ Excel</Button>
            <Button variant="ghost" size="sm" onClick={handleExportPDF}>📄 PDF</Button>
          </div>
        }
      />
      <div className="page-content fade-in">

        {/* Totalizadores rápidos */}
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          {[
            { label: 'Total de Títulos', value: filtered.length, icon: '📄', color: '#2563eb' },
            { label: 'Títulos Vencidos', value: totalVencidos, icon: '⚠️', color: '#ef4444' },
            { label: 'Saldo Total', value: formatCurrency(totalSaldo), icon: '💰', color: '#f59e0b' },
            { label: 'Clientes Distintos', value: new Set(filtered.map((t) => t.clienteId)).size, icon: '👥', color: '#10b981' },
          ].map((card) => (
            <div key={card.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              borderLeft: `3px solid ${card.color}`,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {card.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <Card className="mb-16">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Input
              placeholder="Buscar por cliente, código ou nº título..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); goToPage(1) }}
              icon="🔍"
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select value={filterGrupo} onChange={(e) => { setFilterGrupo(e.target.value); goToPage(1) }}>
              {grupoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); goToPage(1) }}>
              {tipoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filterAtraso} onChange={(e) => { setFilterAtraso(e.target.value); goToPage(1) }}>
              <option value="">Todos</option>
              <option value="vencido">Vencidos</option>
              <option value="no_prazo">No prazo</option>
            </Select>
            <Select value={filterFaixa} onChange={(e) => { setFilterFaixa(e.target.value); goToPage(1) }}>
              {FAIXA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>✕ Limpar</Button>
            )}
          </div>
        </Card>

        {/* Tabela */}
        <Card padding={false}>
          {loading ? (
            <SkeletonTable rows={8} cols={12} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📄</span>
              <p>Nenhum título encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('clienteCodigo')}>Código {sortIcon('clienteCodigo')}</th>
                      <th onClick={() => handleSort('clienteNome')}>Cliente {sortIcon('clienteNome')}</th>
                      <th onClick={() => handleSort('grupoCliente')}>Grupo {sortIcon('grupoCliente')}</th>
                      <th>Prefixo</th>
                      <th onClick={() => handleSort('titulo')}>Título {sortIcon('titulo')}</th>
                      <th>Parcela</th>
                      <th onClick={() => handleSort('tipo')}>Tipo {sortIcon('tipo')}</th>
                      <th onClick={() => handleSort('emissao')}>Emissão {sortIcon('emissao')}</th>
                      <th onClick={() => handleSort('vencimentoOriginal')}>Vencimento {sortIcon('vencimentoOriginal')}</th>
                      <th onClick={() => handleSort('vencimentoReal')}>Venc. Real {sortIcon('vencimentoReal')}</th>
                      <th onClick={() => handleSort('diasAtraso')}>Atraso {sortIcon('diasAtraso')}</th>
                      <th onClick={() => handleSort('valorOriginal')}>Valor Original {sortIcon('valorOriginal')}</th>
                      <th onClick={() => handleSort('saldoAtual')}>Saldo Atual {sortIcon('saldoAtual')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((t) => (
                      <tr
                        key={t.id}
                        className="row-clickable"
                        onClick={() => navigate(`/carteira/${t.clienteId}`)}
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>
                          {t.clienteCodigo}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.clienteNome}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.grupoCliente}</td>
                        <td>{t.prefixo}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.titulo}</td>
                        <td>{t.parcela}</td>
                        <td>
                          <Badge type="default">{t.tipo}</Badge>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.emissao)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.vencimentoOriginal || t.vencimento)}</td>
                        <td style={{ color: t.vencimentoReal ? 'var(--warning)' : 'var(--text-muted)', fontWeight: t.vencimentoReal ? 600 : 400 }}>
                          {t.vencimentoReal ? formatDate(t.vencimentoReal) : '—'}
                        </td>
                        <td>
                          {t.diasAtraso > 0 ? (
                            <Badge type={t.diasAtraso > 120 ? 'danger' : t.diasAtraso > 60 ? 'warning' : 'info'}>
                              {t.diasAtraso}d
                            </Badge>
                          ) : (
                            <Badge type="success">No prazo</Badge>
                          )}
                        </td>
                        <td>{formatCurrency(t.valorOriginal)}</td>
                        <td style={{ fontWeight: 700, color: t.diasAtraso > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {formatCurrency(t.saldoAtual)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg)' }}>
                      <td colSpan={11} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.8rem' }}>
                        Total (página {page}/{totalPages} · {filtered.length} títulos)
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {formatCurrency(paginatedData.reduce((s, t) => s + t.valorOriginal, 0))}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--danger)', fontSize: '0.875rem' }}>
                        {formatCurrency(paginatedData.reduce((s, t) => s + t.saldoAtual, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </Card>
      </div>
    </>
  )
}
