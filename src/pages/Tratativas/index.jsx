import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import { usePagination } from '../../hooks/usePagination'
import { tratativaService } from '../../services/tratativaService'
import { useToast } from '../../context/ToastContext'
import {
  formatDatetime,
  formatDate,
  STATUS_LABELS,
  STATUS_COLORS,
  TIPO_CONTATO_LABELS,
  TIPO_CONTATO_ICONS,
} from '../../utils/formatters'

const PAGE_SIZE = 10
const EMPTY_FORM = {
  clienteId: '',
  clienteNome: '',
  clienteCodigo: '',
  tipoContato: 'ligacao',
  status: 'em_cobranca',
  observacao: '',
  proximaAcao: '',
  dataProximaAcao: '',
}

export default function Tratativas() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const { data: tratativas, loading, refetch } = useApi(
    () => tratativaService.getTratativas(),
    []
  )

  const filtered = useMemo(() => {
    let result = tratativas || []
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((t) =>
        t.clienteNome.toLowerCase().includes(q) ||
        t.clienteCodigo.toLowerCase().includes(q)
      )
    }
    if (filterStatus) result = result.filter((t) => t.status === filterStatus)
    return result
  }, [tratativas, debouncedSearch, filterStatus])

  const { page, totalPages, paginatedData, goToPage } = usePagination(filtered, PAGE_SIZE)

  const handleSave = async () => {
    if (!form.observacao.trim()) {
      addToast('Informe a observação.', 'warning')
      return
    }
    setSaving(true)
    try {
      await tratativaService.createTratativa({
        ...form,
        usuario: 'Ana Costa',
        dataHora: new Date().toISOString(),
      })
      addToast('Tratativa registrada com sucesso.', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      refetch()
    } catch {
      addToast('Erro ao salvar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await tratativaService.deleteTratativa(deleteId)
      addToast('Tratativa excluída.', 'success')
      setDeleteId(null)
      refetch()
    } catch {
      addToast('Erro ao excluir.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header
        title="Tratativas"
        subtitle={`${filtered.length} registros encontrados`}
        breadcrumb={<Breadcrumb items={[{ to: '/', label: 'Dashboard' }, { label: 'Tratativas' }]} />}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)} icon="＋">
            Nova Tratativa
          </Button>
        }
      />
      <div className="page-content fade-in">
        <Card className="mb-16">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Input
              placeholder="Buscar por cliente ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon="🔍"
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); goToPage(1) }}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            {(search || filterStatus) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatus('') }}>✕ Limpar</Button>
            )}
          </div>
        </Card>

        <Card padding={false}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>💬</p>
              <p>Nenhuma tratativa encontrada.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data/Hora</th>
                      <th>Usuário</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Observação</th>
                      <th>Próxima Ação</th>
                      <th>Data Ação</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <button
                            onClick={() => navigate(`/carteira/${t.clienteId}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
                          >
                            {t.clienteNome}
                          </button>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.clienteCodigo}</div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDatetime(t.dataHora)}</td>
                        <td>{t.usuario}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {TIPO_CONTATO_ICONS[t.tipoContato]}
                            <span style={{ fontSize: '0.75rem' }}>{TIPO_CONTATO_LABELS[t.tipoContato]}</span>
                          </span>
                        </td>
                        <td>
                          <Badge type={STATUS_COLORS[t.status] || 'default'}>
                            {STATUS_LABELS[t.status] || t.status}
                          </Badge>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <span style={{ fontSize: '0.775rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {t.observacao}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.775rem', maxWidth: 130 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {t.proximaAcao || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.dataProximaAcao ? formatDate(t.dataProximaAcao) : '—'}
                        </td>
                        <td>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                            title="Excluir"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </>
          )}
        </Card>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova Tratativa"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Registrar</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Tipo de Contato"
              value={form.tipoContato}
              onChange={(e) => setForm((f) => ({ ...f, tipoContato: e.target.value }))}
            >
              {Object.entries(TIPO_CONTATO_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Observação *"
            value={form.observacao}
            onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
            placeholder="Descreva o contato..."
            rows={4}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Próxima Ação"
              value={form.proximaAcao}
              onChange={(e) => setForm((f) => ({ ...f, proximaAcao: e.target.value }))}
            />
            <Input
              type="date"
              label="Data da Próxima Ação"
              value={form.dataProximaAcao}
              onChange={(e) => setForm((f) => ({ ...f, dataProximaAcao: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir tratativa"
        message="Tem certeza que deseja excluir esta tratativa?"
        loading={deleting}
      />
    </>
  )
}
