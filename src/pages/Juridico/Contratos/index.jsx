import { useMemo, useState } from 'react'
import { Header } from '../../../layouts/Header'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Input, Select } from '../../../components/ui/Input'
import { Pagination } from '../../../components/ui/Pagination'
import { Breadcrumb } from '../../../components/common/Breadcrumb'
import { useApi } from '../../../hooks/useApi'
import { usePagination } from '../../../hooks/usePagination'
import { useDebounce } from '../../../hooks/useDebounce'
import { useToast } from '../../../context/ToastContext'
import { useAuth } from '../../../context/AuthContext'
import { contratoService } from '../../../services/contratoService'
import { formatDate } from '../../../utils/formatters'
import {
  EMPRESA_OPTIONS, EMPRESA_LABELS, TIPO_CONTRATO_OPTIONS, TIPO_CONTRATO_LABELS,
  ESPECIE_LABELS, CONTRATO_STATUS_OPTIONS, CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS,
} from '../../../utils/contratoConstants'
import { ContratoFormModal } from './ContratoFormModal'
import { ContratoDetalheModal } from './ContratoDetalheModal'
import '../Juridico.css'

const PAGE_SIZE = 15

export default function Contratos() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contratoAtivo, setContratoAtivo] = useState(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: contratos, loading, refetch } = useApi(() => contratoService.getContratos(), [])

  const filtered = useMemo(() => {
    let result = contratos || []
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((c) =>
        c.clienteNome.toLowerCase().includes(q) ||
        c.numero.toLowerCase().includes(q) ||
        c.clienteCnpj.includes(q)
      )
    }
    if (filterEmpresa) result = result.filter((c) => c.empresa === filterEmpresa)
    if (filterTipo) result = result.filter((c) => c.tipoContrato === filterTipo)
    if (filterStatus) result = result.filter((c) => c.status === filterStatus)
    return result
  }, [contratos, debouncedSearch, filterEmpresa, filterTipo, filterStatus])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const handleCriar = async (form) => {
    setSaving(true)
    try {
      await contratoService.criarContrato(form, user?.nome || user?.username)
      addToast('Contrato criado com sucesso.', 'success')
      setFormOpen(false)
      refetch()
    } catch {
      addToast('Erro ao criar contrato.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const hasFilters = search || filterEmpresa || filterTipo || filterStatus
  const clearFilters = () => { setSearch(''); setFilterEmpresa(''); setFilterTipo(''); setFilterStatus('') }

  return (
    <>
      <Header
        title="Contratos"
        subtitle={`${filtered.length} contratos encontrados`}
        breadcrumb={<Breadcrumb items={[{ to: '/juridico-dashboard', label: 'Jurídico' }, { label: 'Contratos' }]} />}
        actions={<Button variant="primary" onClick={() => setFormOpen(true)}>+ Novo Contrato</Button>}
      />
      <div className="page-content fade-in">

        <Card className="mb-16">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Input
              placeholder="Buscar por cliente, número ou CNPJ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); goToPage(1) }}
              icon="🔍"
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select value={filterEmpresa} onChange={(e) => { setFilterEmpresa(e.target.value); goToPage(1) }}>
              <option value="">Todas as empresas</option>
              {EMPRESA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
            </Select>
            <Select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); goToPage(1) }}>
              <option value="">Todos os tipos</option>
              {TIPO_CONTRATO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); goToPage(1) }}>
              <option value="">Todos os status</option>
              {CONTRATO_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>✕ Limpar</Button>}
          </div>
        </Card>

        <Card padding={false}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando contratos...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>📄</p>
              <p>Nenhum contrato encontrado.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Empresa</th>
                    <th>Tipo</th>
                    <th>Espécie</th>
                    <th>Cliente/Fornecedor</th>
                    <th>Solicitante</th>
                    <th>Data Solicitação</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((c) => (
                    <tr key={c.id} className="row-clickable" onClick={() => setContratoAtivo(c)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.numero}</td>
                      <td>{EMPRESA_LABELS[c.empresa]?.slice(0, 3) || c.empresa}</td>
                      <td>{TIPO_CONTRATO_LABELS[c.tipoContrato]}</td>
                      <td>{ESPECIE_LABELS[c.especie]}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.clienteNome}</span>
                      </td>
                      <td>{c.solicitante}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(c.dataSolicitacao)}</td>
                      <td>
                        <Badge type={CONTRATO_STATUS_COLORS[c.status] || 'default'}>
                          {CONTRATO_STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td>
                        <button className="table-action-btn" style={{ fontSize: '0.7rem' }}>Abrir →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        )}
      </div>

      <ContratoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCriar}
        saving={saving}
      />

      <ContratoDetalheModal
        contrato={contratoAtivo}
        onClose={() => setContratoAtivo(null)}
        onChanged={() => { refetch(); setContratoAtivo(null) }}
        usuarioAtual={user?.nome || user?.username}
      />
    </>
  )
}
