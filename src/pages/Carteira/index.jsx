import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import { clienteService } from '../../services/clienteService'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters'
import './Carteira.css'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'sem_contato', label: 'Sem Contato' },
  { value: 'em_cobranca', label: 'Em Cobrança' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'promessa_pagamento', label: 'Promessa de Pgto' },
  { value: 'aguardando_retorno', label: 'Aguard. Retorno' },
  { value: 'acordo_realizado', label: 'Acordo Realizado' },
]

const RESPONSAVEL_OPTIONS = [
  { value: '', label: 'Todos os responsáveis' },
  { value: 'Ana Costa', label: 'Ana Costa' },
  { value: 'João Lima', label: 'João Lima' },
]

const REGIAO_OPTIONS = [
  { value: '', label: 'Todas as regiões' },
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' },
]

export default function Carteira() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [codigoCliente, setCodigoCliente] = useState('')
  const [filters, setFilters] = useState({ status: '', responsavel: '', regiao: '', grupo: '' })
  const [sortField, setSortField] = useState('maiorAtraso')
  const [sortDir, setSortDir] = useState('desc')
  const [obsModal, setObsModal] = useState({ open: false, cliente: null, text: '' })
  const [obsSaving, setObsSaving] = useState(false)
  const [obsOverrides, setObsOverrides] = useState({})

  const debouncedSearch = useDebounce(search, 350)
  const debouncedCodigo = useDebounce(codigoCliente, 350)

  const { data, loading } = useApi(
    () => clienteService.getClientesInadimplentes(),
    []
  )

  const clientes = data?.data || []

  // Grupos extraídos dinamicamente da API
  const grupoOptions = useMemo(() => {
    const unique = [...new Set(clientes.map((c) => c.grupoCliente).filter((g) => g && g !== '—'))].sort()
    return [
      { value: '', label: 'Todos os grupos' },
      ...unique.map((g) => ({ value: g, label: g })),
    ]
  }, [clientes])

  const filtered = useMemo(() => {
    let result = clientes
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.razaoSocial.toLowerCase().includes(q) ||
          c.nomeFantasia.toLowerCase().includes(q)
      )
    }
    if (debouncedCodigo) {
      const q = debouncedCodigo.toLowerCase()
      result = result.filter((c) => c.codigo.toLowerCase().includes(q))
    }
    if (filters.grupo) result = result.filter((c) => c.grupoCliente === filters.grupo)
    if (filters.status) result = result.filter((c) => c.statusCobranca === filters.status)
    if (filters.responsavel) result = result.filter((c) => c.responsavelCobranca === filters.responsavel)
    if (filters.regiao) result = result.filter((c) => c.regiao === filters.regiao)

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
  }, [clientes, debouncedSearch, debouncedCodigo, filters, sortField, sortDir])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return <span className="sort-icon">↕</span>
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }))
    goToPage(1)
  }

  const hasActiveFilters = search || codigoCliente || filters.status || filters.responsavel || filters.regiao || filters.grupo

  const clearFilters = () => {
    setSearch('')
    setCodigoCliente('')
    setFilters({ status: '', responsavel: '', regiao: '', grupo: '' })
  }

  const obsAtual = (c) => obsOverrides[c.id] ?? c.observacoes ?? ''

  const openObsModal = (e, c) => {
    e.stopPropagation()
    setObsModal({ open: true, cliente: c, text: obsAtual(c) })
  }

  const closeObsModal = () => {
    if (obsSaving) return
    setObsModal({ open: false, cliente: null, text: '' })
  }

  const saveObs = async () => {
    if (!obsModal.cliente || obsSaving) return
    setObsSaving(true)
    try {
      await clienteService.alterarObservacao(obsModal.cliente.id, obsModal.text)
      setObsOverrides((prev) => ({ ...prev, [obsModal.cliente.id]: obsModal.text }))
      addToast('Observação salva com sucesso!', 'success')
      setObsModal({ open: false, cliente: null, text: '' })
    } catch {
      addToast('Erro ao salvar observação.', 'error')
    } finally {
      setObsSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Carteira de Cobrança"
        subtitle={`${filtered.length} clientes encontrados`}
        breadcrumb={<Breadcrumb items={[{ to: '/', label: 'Dashboard' }, { label: 'Carteira' }]} />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" icon="⬇">Excel</Button>
            <Button variant="ghost" size="sm" icon="📄">PDF</Button>
          </div>
        }
      />
      <div className="page-content fade-in">
        {/* Filters */}
        <Card className="mb-16">
          <div className="carteira-filters">
            <Input
              placeholder="Buscar por nome ou fantasia..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); goToPage(1) }}
              icon="🔍"
              className="filter-search"
            />
            <Input
              placeholder="Código do cliente"
              value={codigoCliente}
              onChange={(e) => { setCodigoCliente(e.target.value); goToPage(1) }}
              style={{ width: 160 }}
            />
            <Select value={filters.grupo} onChange={(e) => setFilter('grupo', e.target.value)}>
              {grupoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filters.responsavel} onChange={(e) => setFilter('responsavel', e.target.value)}>
              {RESPONSAVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filters.regiao} onChange={(e) => setFilter('regiao', e.target.value)}>
              {REGIAO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>✕ Limpar</Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card padding={false}>
          {loading ? (
            <SkeletonTable rows={8} cols={13} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <p>Nenhum cliente encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('filial')}>Filial {sortIcon('filial')}</th>
                      <th onClick={() => handleSort('codigo')}>Código {sortIcon('codigo')}</th>
                      <th onClick={() => handleSort('razaoSocial')}>Razão Social {sortIcon('razaoSocial')}</th>
                      <th>Fantasia</th>
                      <th onClick={() => handleSort('grupoCliente')}>Grupo de Venda {sortIcon('grupoCliente')}</th>
                      <th onClick={() => handleSort('cidade')}>Cidade/UF {sortIcon('cidade')}</th>
                      <th>Responsável</th>
                      <th onClick={() => handleSort('valorTotalAberto')}>Valor Aberto {sortIcon('valorTotalAberto')}</th>
                      <th onClick={() => handleSort('qtdTitulosVencidos')}>Títulos {sortIcon('qtdTitulosVencidos')}</th>
                      <th onClick={() => handleSort('maiorAtraso')}>Maior Atraso {sortIcon('maiorAtraso')}</th>
                      <th onClick={() => handleSort('ultimoContato')}>Último Contato {sortIcon('ultimoContato')}</th>
                      <th>Próxima Ação</th>
                      <th onClick={() => handleSort('statusCobranca')}>Status {sortIcon('statusCobranca')}</th>
                      <th>Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((c) => (
                      <tr
                        key={c.id}
                        className="row-clickable"
                        onClick={() => navigate(`/carteira/${c.id}`)}
                      >
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.filial}</td>
                        <td className="td-codigo">{c.codigo}</td>
                        <td className="td-nome">{c.razaoSocial}</td>
                        <td className="text-secondary">{c.nomeFantasia}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{c.grupoCliente}</td>
                        <td>{c.cidade}/{c.uf}</td>
                        <td>{c.responsavelCobranca}</td>
                        <td className="td-valor">{formatCurrency(c.valorTotalAberto)}</td>
                        <td className="td-center">{c.qtdTitulosVencidos}</td>
                        <td>
                          <Badge type={c.maiorAtraso > 120 ? 'danger' : c.maiorAtraso > 60 ? 'warning' : 'info'}>
                            {c.maiorAtraso}d
                          </Badge>
                        </td>
                        <td className="text-secondary">{formatDate(c.ultimoContato)}</td>
                        <td>
                          <div className="proxima-acao">
                            <span className="acao-text">{c.proximaAcao}</span>
                            {c.dataProximaAcao && (
                              <span className="acao-data">{formatDate(c.dataProximaAcao)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge type={STATUS_COLORS[c.statusCobranca] || 'default'}>
                            {STATUS_LABELS[c.statusCobranca] || c.statusCobranca}
                          </Badge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="obs-cell">
                            {obsAtual(c) && (
                              <span className="obs-preview" title={obsAtual(c)}>{obsAtual(c)}</span>
                            )}
                            <button className="obs-edit-btn" onClick={(e) => openObsModal(e, c)} title="Editar observação">✏</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
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

      <Modal
        open={obsModal.open}
        onClose={closeObsModal}
        title={`Observação — ${obsModal.cliente?.razaoSocial || ''}`}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeObsModal} disabled={obsSaving}>Cancelar</Button>
            <Button variant="primary" onClick={saveObs} loading={obsSaving}>Salvar</Button>
          </div>
        }
      >
        <div style={{ marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Cliente: <strong style={{ color: 'var(--text-secondary)' }}>{obsModal.cliente?.codigo}</strong>
          {' · '}Loja: <strong style={{ color: 'var(--text-secondary)' }}>{obsModal.cliente?.loja}</strong>
        </div>
        <textarea
          value={obsModal.text}
          onChange={(e) => setObsModal((m) => ({ ...m, text: e.target.value }))}
          rows={5}
          placeholder="Digite a observação sobre este cliente..."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </Modal>
    </>
  )
}
