import { useState, useMemo, useRef, useEffect } from 'react'
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

function MultiSelectDropdown({ options, selected, onChange, placeholder = 'Selecionar' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const displayLabel = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (normalized.find((o) => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selecionados`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          height: 36, padding: '0 12px', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', background: 'var(--surface)',
          color: selected.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.875rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 6, whiteSpace: 'nowrap', minWidth: 130,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{displayLabel}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
          minWidth: 170, maxHeight: 240, overflowY: 'auto', padding: '4px 0',
        }}>
          {normalized.map(({ value, label }) => (
            <div
              key={value || '__empty__'}
              onClick={() => toggle(value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)',
                userSelect: 'none',
                background: selected.includes(value) ? 'var(--primary-bg, #eff6ff)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!selected.includes(value)) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = selected.includes(value) ? 'var(--primary-bg, #eff6ff)' : 'transparent' }}
            >
              <input type="checkbox" checked={selected.includes(value)} readOnly
                style={{ accentColor: 'var(--primary)', width: 14, height: 14, pointerEvents: 'none' }} />
              {label}
            </div>
          ))}
          {selected.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px' }}>
              <button type="button" onClick={() => { onChange([]); setOpen(false) }}
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FAIXA_OPTIONS = [
  { value: '1-30',   label: '1 a 30 dias' },
  { value: '31-60',  label: '31 a 60 dias' },
  { value: '61-90',  label: '61 a 90 dias' },
  { value: '91-180', label: '91 a 180 dias' },
  { value: '+180',   label: 'Acima de 180 dias' },
]

const ATRASO_OPTIONS = [
  { value: 'vencido',   label: 'Vencidos' },
  { value: 'a_vencer',  label: 'A Vencer (hoje)' },
  { value: 'no_prazo',  label: 'No Prazo' },
]

const MOTIVO_OPTIONS = [
  { value: '1', label: 'SETTA' },
  { value: '2', label: 'CLIENTE' },
  { value: '',  label: 'Sem motivo' },
]

export default function TitulosJuridico() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterTipos, setFilterTipos] = useState([])
  const [filterFaixas, setFilterFaixas] = useState([])
  const [filterAtrasos, setFilterAtrasos] = useState([])
  const [filterGrupo, setFilterGrupo] = useState('')
  const [filterMotivos, setFilterMotivos] = useState([])
  const [sortField, setSortField] = useState('diasAtraso')
  const [sortDir, setSortDir] = useState('desc')

  const debouncedSearch = useDebounce(search, 350)

  const { data, loading } = useApi(() => tituloService.getTitulos(), [])
  const allTitulos = (data?.data || []).filter((t) => t.inadimplencia === '3')

  const grupoOptions = useMemo(() => {
    const unique = [...new Set(allTitulos.map((t) => t.grupoCliente).filter((g) => g && g !== '—'))].sort()
    return [
      { value: '', label: 'Todos os grupos' },
      ...unique.map((g) => ({ value: g, label: g })),
    ]
  }, [allTitulos])

  const tipoOptions = useMemo(
    () => [...new Set(allTitulos.map((t) => t.tipo).filter((t) => t && t !== '—'))].sort(),
    [allTitulos],
  )

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
    if (filterTipos.length > 0) result = result.filter((t) => filterTipos.includes(t.tipo))
    if (filterAtrasos.length > 0) {
      result = result.filter((t) =>
        filterAtrasos.some((f) => {
          if (f === 'vencido')   return t.isVencido && !t.aVencer
          if (f === 'a_vencer')  return t.aVencer
          if (f === 'no_prazo')  return !t.isVencido && !t.aVencer
          return false
        })
      )
    }
    if (filterMotivos.length > 0)
      result = result.filter((t) => filterMotivos.includes(t.motivo))
    if (filterFaixas.length > 0) {
      result = result.filter((t) =>
        filterFaixas.some((f) => {
          if (f === '1-30')   return t.diasAtraso >= 1   && t.diasAtraso <= 30
          if (f === '31-60')  return t.diasAtraso >= 31  && t.diasAtraso <= 60
          if (f === '61-90')  return t.diasAtraso >= 61  && t.diasAtraso <= 90
          if (f === '91-180') return t.diasAtraso >= 91  && t.diasAtraso <= 180
          if (f === '+180')   return t.diasAtraso > 180
          return false
        })
      )
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
  }, [allTitulos, debouncedSearch, filterGrupo, filterTipos, filterFaixas, filterAtrasos, filterMotivos, sortField, sortDir])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const totalSaldo = filtered.reduce((s, t) => s + t.saldoAtual, 0)
  const totalVencidos = filtered.filter((t) => t.isVencido).length

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('desc') }
  }

  const sortIcon = (field) => (
    <span className="sort-icon" style={sortField === field ? { color: 'var(--primary)' } : {}}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const hasFilters = search || filterGrupo || filterTipos.length > 0 || filterFaixas.length > 0 || filterAtrasos.length > 0 || filterMotivos.length > 0
  const clearFilters = () => { setSearch(''); setFilterGrupo(''); setFilterTipos([]); setFilterFaixas([]); setFilterAtrasos([]); setFilterMotivos([]) }

  function handleExportCSV() {
    const headers = [
      'EMPRESA', 'CARTEIRA', 'TITULO', 'COD_CLIENTE', 'CLIENTE',
      'VENCIMENTO', 'REPROGRAMADO', 'VALOR', 'EMISSAO', 'TIPO',
      'NATUREZA', 'BAIXA', 'SALDO', 'DIAS_ATRASO', 'VENCIDO', 'GRUPO_VEN',
    ]
    const fmt = (d) => {
      if (!d) return ''
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}${m}${dd}`
    }
    const rows = filtered.map((t) => [
      t.filial, 'RECEBER', t.titulo, t.clienteId, t.clienteNome,
      fmt(t.vencimentoOriginal), fmt(t.vencimentoReal),
      t.valorOriginal.toFixed(2).replace('.', ','),
      fmt(t.emissao), t.tipo, t.natureza, fmt(t.dtBaixa),
      t.saldoAtual.toFixed(2).replace('.', ','),
      t.diasAtraso, t.isVencido ? 'S' : 'N', t.vendedor,
    ])
    exportToCSV(headers, rows, 'titulos_juridico.csv')
  }

  function handleExportPDF() {
    exportToPrint('Títulos Jurídico')
  }

  return (
    <>
      <Header
        title="Títulos Jurídico"
        subtitle={`${filtered.length} títulos encontrados · Saldo total: ${formatCurrency(totalSaldo)}`}
        breadcrumb={
          <Breadcrumb items={[
            { to: '/', label: 'Dashboard' },
            { to: '/titulos', label: 'Consulta de Títulos' },
            { label: 'Jurídico' },
          ]} />
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExportCSV}>⬇ Excel</Button>
            <Button variant="ghost" size="sm" onClick={handleExportPDF}>📄 PDF</Button>
          </div>
        }
      />
      <div className="page-content fade-in">

        {/* Totalizadores */}
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          {[
            { label: 'Total de Títulos',   value: filtered.length,                                          icon: '⚖️',  color: '#dc2626' },
            { label: 'Títulos Vencidos',   value: totalVencidos,                                            icon: '⚠️',  color: '#ef4444' },
            { label: 'Saldo Total',        value: formatCurrency(totalSaldo),                               icon: '💰',  color: '#f59e0b' },
            { label: 'Clientes Distintos', value: new Set(filtered.map((t) => t.clienteId)).size,           icon: '👥',  color: '#7c3aed' },
          ].map((card) => (
            <div key={card.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '14px 18px',
              borderLeft: `3px solid ${card.color}`, boxShadow: 'var(--shadow-sm)',
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
            <MultiSelectDropdown
              options={tipoOptions}
              selected={filterTipos}
              onChange={(v) => { setFilterTipos(v); goToPage(1) }}
              placeholder="Todos os tipos"
            />
            <MultiSelectDropdown
              options={ATRASO_OPTIONS}
              selected={filterAtrasos}
              onChange={(v) => { setFilterAtrasos(v); goToPage(1) }}
              placeholder="Situação"
            />
            <MultiSelectDropdown
              options={MOTIVO_OPTIONS}
              selected={filterMotivos}
              onChange={(v) => { setFilterMotivos(v); goToPage(1) }}
              placeholder="Motivo"
            />
            <MultiSelectDropdown
              options={FAIXA_OPTIONS}
              selected={filterFaixas}
              onChange={(v) => { setFilterFaixas(v); goToPage(1) }}
              placeholder="Faixa de atraso"
            />
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
              <span className="empty-icon">⚖️</span>
              <p>Nenhum título jurídico encontrado com os filtros aplicados.</p>
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
                      <th onClick={() => handleSort('vencimentoOriginal')}>Venc. Original {sortIcon('vencimentoOriginal')}</th>
                      <th onClick={() => handleSort('vencimentoReal')}>Venc. Reprogramado {sortIcon('vencimentoReal')}</th>
                      <th onClick={() => handleSort('diasAtraso')}>Atraso {sortIcon('diasAtraso')}</th>
                      <th onClick={() => handleSort('valorOriginal')}>Valor Original {sortIcon('valorOriginal')}</th>
                      <th onClick={() => handleSort('saldoAtual')}>Saldo Atual {sortIcon('saldoAtual')}</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((t) => (
                      <tr
                        key={t.id}
                        className="row-clickable"
                        onClick={() => navigate(`/carteira/${t.clienteId}`)}
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>{t.clienteCodigo}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.clienteNome}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.grupoCliente}</td>
                        <td>{t.prefixo}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.titulo}</td>
                        <td>{t.parcela}</td>
                        <td><Badge type="default">{t.tipo}</Badge></td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.emissao)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.vencimentoOriginal || t.vencimento)}</td>
                        <td style={{ color: t.vencimentoReal ? 'var(--warning)' : 'var(--text-muted)', fontWeight: t.vencimentoReal ? 600 : 400 }}>
                          {t.vencimentoReal ? formatDate(t.vencimentoReal) : '—'}
                        </td>
                        <td>
                          {t.aVencer ? (
                            <Badge type="warning">A Vencer</Badge>
                          ) : t.diasAtraso > 0 ? (
                            <Badge type={t.diasAtraso > 120 ? 'danger' : t.diasAtraso > 60 ? 'warning' : 'info'}>
                              {t.diasAtraso}d
                            </Badge>
                          ) : (
                            <Badge type="success">No prazo</Badge>
                          )}
                        </td>
                        <td>{formatCurrency(t.valorOriginal)}</td>
                        <td style={{ fontWeight: 700, color: (t.isVencido || t.aVencer) ? 'var(--danger)' : 'var(--success)' }}>
                          {formatCurrency(t.saldoAtual)}
                        </td>
                        <td>
                          {t.motivo === '1' ? (
                            <Badge type="warning">SETTA</Badge>
                          ) : t.motivo === '2' ? (
                            <Badge type="info">CLIENTE</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
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
                      <td />
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
