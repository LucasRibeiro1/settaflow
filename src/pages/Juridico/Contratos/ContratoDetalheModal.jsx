import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Select, Textarea } from '../../../components/ui/Input'
import { useToast } from '../../../context/ToastContext'
import { formatDate, formatCNPJ } from '../../../utils/formatters'
import {
  EMPRESA_LABELS, TIPO_CONTRATO_LABELS, ESPECIE_LABELS, MODALIDADE_LABELS,
  MINUTAGEM_LABELS, ASSINANTE_LABELS, TIPO_SEGURO_LABELS, NDA_INFO_LABELS,
  CONTRATO_STATUS_OPTIONS, CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS,
} from '../../../utils/contratoConstants'
import { contratoService } from '../../../services/contratoService'

function Campo({ label, value }) {
  if (!value) return null
  return (
    <div>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      <p style={{ fontWeight: 600, fontSize: '0.825rem', marginTop: 2 }}>{value}</p>
    </div>
  )
}

export function ContratoDetalheModal({ contrato, onClose, onChanged, usuarioAtual }) {
  const { addToast } = useToast()
  const [novoStatus, setNovoStatus] = useState('')
  const [obsAnalise, setObsAnalise] = useState('')
  const [saving, setSaving] = useState(false)

  if (!contrato) return null

  const handleAlterarStatus = async () => {
    if (!novoStatus) return
    setSaving(true)
    try {
      await contratoService.alterarStatus(contrato.id, novoStatus, usuarioAtual)
      addToast('Status do contrato atualizado.', 'success')
      setNovoStatus('')
      onChanged()
    } catch {
      addToast('Erro ao alterar status.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEnviarAnalise = async () => {
    if (!obsAnalise.trim()) {
      addToast('Descreva a análise técnica antes de enviar.', 'warning')
      return
    }
    setSaving(true)
    try {
      await contratoService.enviarAnaliseTecnica(contrato.id, obsAnalise, usuarioAtual)
      addToast('Análise técnica enviada ao solicitante.', 'success')
      setObsAnalise('')
      onChanged()
    } catch {
      addToast('Erro ao enviar análise.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAprovacaoPowerAutomate = () => {
    addToast('Aprovação disparada no Power Automate (integração a ser configurada).', 'info')
  }

  return (
    <Modal open={!!contrato} onClose={onClose} title={`Contrato ${contrato.numero}`} size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Badge type={CONTRATO_STATUS_COLORS[contrato.status] || 'default'}>
            {CONTRATO_STATUS_LABELS[contrato.status]}
          </Badge>
          {contrato.responsavelAtual && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Responsável atual: <strong>{contrato.responsavelAtual}</strong>
            </span>
          )}
        </div>

        <div>
          <h4 className="contrato-form-section">Dados do Contrato</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px' }}>
            <Campo label="Empresa" value={EMPRESA_LABELS[contrato.empresa]} />
            <Campo label="Tipo de Contrato" value={TIPO_CONTRATO_LABELS[contrato.tipoContrato]} />
            <Campo label="Espécie" value={ESPECIE_LABELS[contrato.especie]} />
            <Campo label="Modalidade" value={MODALIDADE_LABELS[contrato.modalidade]} />
            {contrato.contratoOriginal && <Campo label="Contrato Original" value={contrato.contratoOriginal} />}
            <Campo label="Minutagem" value={MINUTAGEM_LABELS[contrato.minutagem]} />
            <Campo label="Seguro/Garantia" value={contrato.seguroGarantia === 'sim' ? (TIPO_SEGURO_LABELS[contrato.tipoSeguro] || 'Sim') : 'Não'} />
            <Campo label="Assinará o Contrato" value={ASSINANTE_LABELS[contrato.assinante]} />
            {contrato.ndaInfo?.length > 0 && (
              <Campo label="Informações do NDA" value={contrato.ndaInfo.map((v) => NDA_INFO_LABELS[v]).join(', ')} />
            )}
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">Cliente/Fornecedor</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px' }}>
            <Campo label="Nome" value={contrato.clienteNome} />
            <Campo label="CNPJ" value={formatCNPJ(contrato.clienteCnpj)} />
            <Campo label="E-mail" value={contrato.clienteEmail} />
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">Solicitação</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px' }}>
            <Campo label="Data de Solicitação" value={formatDate(contrato.dataSolicitacao)} />
            <Campo label="Solicitante" value={contrato.solicitante} />
            <Campo label="Data de Assinatura" value={contrato.dataAssinatura ? formatDate(contrato.dataAssinatura) : '—'} />
            <Campo label="Vencimento" value={contrato.dataVencimento ? formatDate(contrato.dataVencimento) : '—'} />
          </div>
          {contrato.observacoes && (
            <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Observações:</strong> {contrato.observacoes}
            </p>
          )}
          {contrato.analiseTecnica && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0e7490', textTransform: 'uppercase' }}>Análise Técnica</span>
              <p style={{ fontSize: '0.825rem', marginTop: 4 }}>{contrato.analiseTecnica}</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="contrato-form-section">Portal Contratos</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Select label="Alterar Status" value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} style={{ minWidth: 220 }}>
                <option value="">Selecione o novo status...</option>
                {CONTRATO_STATUS_OPTIONS.filter((o) => o.value !== contrato.status).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <Button variant="primary" size="sm" onClick={handleAlterarStatus} loading={saving} disabled={!novoStatus}>
                Aplicar Status
              </Button>
            </div>

            <div>
              <Textarea
                label="Análise Técnica para o Solicitante"
                value={obsAnalise}
                onChange={(e) => setObsAnalise(e.target.value)}
                placeholder="Descreva as informações adicionais/ajustes necessários..."
                rows={3}
              />
              <div style={{ marginTop: 8 }}>
                <Button variant="secondary" size="sm" onClick={handleEnviarAnalise} loading={saving}>
                  📤 Enviar Análise Técnica ao Solicitante
                </Button>
              </div>
            </div>

            <div>
              <Button variant="ghost" size="sm" onClick={handleAprovacaoPowerAutomate}>
                🔄 Disparar Aprovação (Power Automate)
              </Button>
            </div>
          </div>
        </div>

        {contrato.historico?.length > 0 && (
          <div>
            <h4 className="contrato-form-section">Histórico</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...contrato.historico].reverse().map((h, i) => (
                <div key={i} style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 78 }}>{formatDate(h.data)}</span>
                  <span>{h.evento}{h.usuario ? ` — ${h.usuario}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
