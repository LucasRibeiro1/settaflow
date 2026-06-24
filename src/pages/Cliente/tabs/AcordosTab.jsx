import { useState } from 'react'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input, Select, Textarea } from '../../../components/ui/Input'
import { useApi } from '../../../hooks/useApi'
import { acordoService } from '../../../services/acordoService'
import { useToast } from '../../../context/ToastContext'
import { formatCurrency, formatDate, ACORDO_STATUS_LABELS, ACORDO_STATUS_COLORS } from '../../../utils/formatters'

const EMPTY_FORM = {
  dataAcordo: new Date().toISOString().split('T')[0],
  valorNegociado: '',
  qtdParcelas: '',
  vencimentoPrimeiraParcela: '',
  observacoes: '',
  status: 'em_aberto',
}

export function AcordosTab({ clienteId, cliente }) {
  const { addToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: acordos, loading, refetch } = useApi(
    () => acordoService.getAcordosCliente(clienteId),
    [clienteId]
  )

  const handleSave = async () => {
    if (!form.valorNegociado || !form.qtdParcelas || !form.vencimentoPrimeiraParcela) {
      addToast('Preencha todos os campos obrigatórios.', 'warning')
      return
    }
    setSaving(true)
    try {
      await acordoService.createAcordo({
        ...form,
        clienteId: Number(clienteId),
        clienteNome: cliente.razaoSocial,
        clienteCodigo: cliente.codigo,
        valorNegociado: parseFloat(String(form.valorNegociado).replace(',', '.')),
        qtdParcelas: parseInt(form.qtdParcelas),
        usuario: 'Ana Costa',
      })
      addToast('Acordo cadastrado com sucesso.', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      refetch()
    } catch {
      addToast('Erro ao cadastrar acordo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await acordoService.updateAcordo(id, { status })
      addToast('Status do acordo atualizado.', 'success')
      refetch()
    } catch {
      addToast('Erro ao atualizar status.', 'error')
    }
  }

  return (
    <>
      <Card padding={false}>
        <CardHeader
          title="Acordos de Negociação"
          subtitle="Parcelamentos e negociações formalizadas"
          actions={
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} icon="＋">
              Novo Acordo
            </Button>
          }
        />

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : !acordos?.length ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤝</p>
            <p>Nenhum acordo cadastrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {acordos.map((a) => (
              <div key={a.id} style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Badge type={ACORDO_STATUS_COLORS[a.status] || 'default'} size="md">
                      {ACORDO_STATUS_LABELS[a.status]}
                    </Badge>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Firmado em {formatDate(a.dataAcordo)} · {a.usuario}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor Negociado</span>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: 2 }}>{formatCurrency(a.valorNegociado)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parcelas</span>
                      <p style={{ fontWeight: 600, marginTop: 2 }}>{a.qtdParcelas}x</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>1ª Parcela</span>
                      <p style={{ fontWeight: 600, marginTop: 2 }}>{formatDate(a.vencimentoPrimeiraParcela)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor/Parcela</span>
                      <p style={{ fontWeight: 600, marginTop: 2 }}>
                        {formatCurrency(a.valorNegociado / a.qtdParcelas)}
                      </p>
                    </div>
                  </div>
                  {a.observacoes && (
                    <p style={{ marginTop: 8, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {a.observacoes}
                    </p>
                  )}
                </div>
                {a.status === 'em_aberto' && (
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                    <Button size="xs" variant="success" onClick={() => handleUpdateStatus(a.id, 'cumprido')}>
                      ✓ Cumpriu
                    </Button>
                    <Button size="xs" variant="danger" onClick={() => handleUpdateStatus(a.id, 'quebrado')}>
                      ✕ Quebrou
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Cadastrar Acordo"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Salvar Acordo</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              type="date"
              label="Data do Acordo *"
              value={form.dataAcordo}
              onChange={(e) => setForm((f) => ({ ...f, dataAcordo: e.target.value }))}
            />
            <Input
              type="number"
              label="Valor Negociado (R$) *"
              value={form.valorNegociado}
              onChange={(e) => setForm((f) => ({ ...f, valorNegociado: e.target.value }))}
              placeholder="0,00"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              type="number"
              label="Quantidade de Parcelas *"
              value={form.qtdParcelas}
              onChange={(e) => setForm((f) => ({ ...f, qtdParcelas: e.target.value }))}
              placeholder="Ex: 3"
              min={1}
            />
            <Input
              type="date"
              label="Vencimento da 1ª Parcela *"
              value={form.vencimentoPrimeiraParcela}
              onChange={(e) => setForm((f) => ({ ...f, vencimentoPrimeiraParcela: e.target.value }))}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {Object.entries(ACORDO_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Textarea
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            placeholder="Detalhes do acordo..."
            rows={3}
          />
        </div>
      </Modal>
    </>
  )
}
