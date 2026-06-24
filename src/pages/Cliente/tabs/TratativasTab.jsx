import { useState, useRef } from 'react'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input, Select, Textarea } from '../../../components/ui/Input'
import { useApi } from '../../../hooks/useApi'
import { tratativaService } from '../../../services/tratativaService'
import { useToast } from '../../../context/ToastContext'
import {
  formatDatetime,
  STATUS_LABELS,
  STATUS_COLORS,
  TIPO_CONTATO_LABELS,
  TIPO_CONTATO_ICONS,
} from '../../../utils/formatters'
import './TratativasTab.css'

const EMPTY_FORM = {
  tipoContato: 'ligacao',
  status: 'em_cobranca',
  observacao: '',
  proximaAcao: '',
  dataProximaAcao: '',
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FILE_ICON = {
  'application/pdf': '📄',
  'image/png': '🖼',
  'image/jpeg': '🖼',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-excel': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
}

export function TratativasTab({ clienteId, cliente }) {
  const { addToast } = useToast()
  const fileInputRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [attachments, setAttachments] = useState([])
  const [saving, setSaving] = useState(false)

  const { data: tratativas, loading, refetch } = useApi(
    () => tratativaService.getTratativasCliente(clienteId),
    [clienteId]
  )

  const openNew = () => {
    setForm(EMPTY_FORM)
    setAttachments([])
    setShowForm(true)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const MAX_MB = 10
    const valid = files.filter((f) => {
      if (f.size > MAX_MB * 1024 * 1024) {
        addToast(`Arquivo "${f.name}" excede ${MAX_MB}MB.`, 'warning')
        return false
      }
      return true
    })
    setAttachments((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, name: f.name, size: f.size, type: f.type })),
    ])
    e.target.value = ''
  }

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!form.observacao.trim()) {
      addToast('Informe a observação.', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        clienteId: clienteId,
        clienteNome: cliente.razaoSocial,
        clienteCodigo: cliente.codigo,
        usuario: 'Ana Costa',
        dataHora: new Date().toISOString(),
        anexos: attachments.map((a) => ({ nome: a.name, tamanho: a.size, tipo: a.type })),
      }
      await tratativaService.createTratativa(payload)
      addToast('Tratativa registrada com sucesso.', 'success')
      setShowForm(false)
      refetch()
    } catch {
      addToast('Erro ao salvar tratativa.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card padding={false}>
        <CardHeader
          title="Histórico de Tratativas"
          subtitle="Timeline de contatos e negociações"
          actions={
            <Button variant="primary" size="sm" onClick={openNew} icon="＋">
              Nova Tratativa
            </Button>
          }
        />

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : !tratativas?.length ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>💬</p>
            <p>Nenhuma tratativa registrada ainda.</p>
            <Button variant="primary" size="sm" onClick={openNew} style={{ marginTop: 12 }}>
              Registrar primeiro contato
            </Button>
          </div>
        ) : (
          <div className="tratativas-timeline">
            {tratativas.map((t) => (
              <div key={t.id} className="tratativa-item">
                <div className="tratativa-icon-col">
                  <div className="tratativa-icon">{TIPO_CONTATO_ICONS[t.tipoContato]}</div>
                  <div className="tratativa-line" />
                </div>
                <div className="tratativa-body">
                  <div className="tratativa-header">
                    <div className="tratativa-meta">
                      <span className="tratativa-tipo">{TIPO_CONTATO_LABELS[t.tipoContato]}</span>
                      <span className="tratativa-dot">·</span>
                      <span className="tratativa-user">{t.usuario}</span>
                      <span className="tratativa-dot">·</span>
                      <span className="tratativa-date">{formatDatetime(t.dataHora)}</span>
                    </div>
                    <Badge type={STATUS_COLORS[t.status] || 'default'}>
                      {STATUS_LABELS[t.status] || t.status}
                    </Badge>
                  </div>
                  <p className="tratativa-obs">{t.observacao}</p>
                  {t.proximaAcao && (
                    <div className="tratativa-proxima">
                      <span>➜ Próxima ação: </span>
                      <strong>{t.proximaAcao}</strong>
                      {t.dataProximaAcao && <span> · {t.dataProximaAcao}</span>}
                    </div>
                  )}
                  {t.anexos?.length > 0 && (
                    <div className="tratativa-anexos">
                      <span className="tratativa-anexos-label">📎 Anexos:</span>
                      <div className="tratativa-anexos-list">
                        {t.anexos.map((a, i) => (
                          <span key={i} className="tratativa-anexo-chip">
                            {FILE_ICON[a.tipo] || '📎'} {a.nome}
                            <span className="anexo-size">{formatBytes(a.tamanho)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form Modal */}
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
            placeholder="Descreva o contato realizado..."
            rows={4}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Próxima Ação"
              value={form.proximaAcao}
              onChange={(e) => setForm((f) => ({ ...f, proximaAcao: e.target.value }))}
              placeholder="Ex: Ligar novamente"
            />
            <Input
              type="date"
              label="Data da Próxima Ação"
              value={form.dataProximaAcao}
              onChange={(e) => setForm((f) => ({ ...f, dataProximaAcao: e.target.value }))}
            />
          </div>

          {/* Anexos */}
          <div>
            <label className="input-label" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Anexos
            </label>
            <div
              className="anexo-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dt = e.dataTransfer
                if (dt.files.length) {
                  handleFileChange({ target: { files: dt.files, value: '' } })
                }
              }}
            >
              <span className="anexo-drop-icon">📎</span>
              <span className="anexo-drop-text">
                Clique ou arraste arquivos aqui
              </span>
              <span className="anexo-drop-hint">PDF, imagens, planilhas, documentos — máx. 10 MB por arquivo</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {attachments.length > 0 && (
              <div className="anexo-preview-list">
                {attachments.map((a, i) => (
                  <div key={i} className="anexo-preview-item">
                    <span className="anexo-preview-icon">{FILE_ICON[a.type] || '📎'}</span>
                    <div className="anexo-preview-info">
                      <span className="anexo-preview-name">{a.name}</span>
                      <span className="anexo-preview-size">{formatBytes(a.size)}</span>
                    </div>
                    <button
                      className="anexo-remove-btn"
                      onClick={() => removeAttachment(i)}
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
