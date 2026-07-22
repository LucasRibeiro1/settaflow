import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input, Select, Textarea } from '../../../components/ui/Input'
import {
  EMPRESA_OPTIONS, TIPO_CONTRATO_OPTIONS, getEspecieOptions, NDA_INFO_OPTIONS,
  MODALIDADE_OPTIONS, SEGURO_GARANTIA_OPTIONS, TIPO_SEGURO_OPTIONS, MINUTAGEM_OPTIONS,
  ASSINANTE_OPTIONS,
} from '../../../utils/contratoConstants'

const FORM_INICIAL = {
  empresa: 'SEN',
  tipoContrato: 'cliente',
  anexoLocacao: null,
  especie: 'fornecimento_equipamento',
  ndaInfo: [],
  modalidade: 'inicial',
  contratoOriginal: '',
  seguroGarantia: 'nao',
  tipoSeguro: '',
  minutagem: 'padrao_setta',
  anexoMinuta: null,
  clienteNome: '',
  clienteCnpj: '',
  clienteEmail: '',
  assinante: 'responsavel_legal',
  anexoProcuracao: null,
  anexoPropostaComercial: null,
  observacoes: '',
  dataSolicitacao: new Date().toISOString().slice(0, 10),
  solicitante: '',
}

function AnexoField({ label, value, onChange, required }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}{required && ' *'}</label>
      <input
        type="file"
        className="input"
        onChange={(e) => onChange(e.target.files?.[0]?.name || null)}
      />
      {value && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
          📎 {value}
        </span>
      )}
    </div>
  )
}

export function ContratoFormModal({ open, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(FORM_INICIAL)

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm((f) => {
      const next = { ...f, [field]: value }
      // Reseta espécie ao trocar de empresa (opções dependem da empresa)
      if (field === 'empresa') next.especie = getEspecieOptions(value)[0].value
      return next
    })
  }

  const toggleNdaInfo = (value) => {
    setForm((f) => ({
      ...f,
      ndaInfo: f.ndaInfo.includes(value) ? f.ndaInfo.filter((v) => v !== value) : [...f.ndaInfo, value],
    }))
  }

  const handleClose = () => {
    setForm(FORM_INICIAL)
    onClose()
  }

  const isValid = form.clienteNome.trim() && form.clienteCnpj.trim() && form.solicitante.trim()

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo Contrato"
      size="xl"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving} disabled={!isValid}>
            Criar Contrato
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <h4 className="contrato-form-section">1. Classificação</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Select label="Empresa do Grupo Setta" value={form.empresa} onChange={set('empresa')}>
              {EMPRESA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select label="Tipo de Contrato" value={form.tipoContrato} onChange={set('tipoContrato')}>
              {TIPO_CONTRATO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select label="Espécie de Contrato" value={form.especie} onChange={set('especie')}>
              {getEspecieOptions(form.empresa).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          {form.tipoContrato === 'locacao' && (
            <div style={{ marginTop: 12 }}>
              <AnexoField label="Anexo do Documento de Locação" value={form.anexoLocacao} onChange={set('anexoLocacao')} />
            </div>
          )}

          {form.especie === 'nda' && (
            <div style={{ marginTop: 12 }}>
              <span className="input-label" style={{ display: 'block', marginBottom: 6 }}>Informações abrangidas pelo NDA</span>
              <div style={{ display: 'flex', gap: 16 }}>
                {NDA_INFO_OPTIONS.map((o) => (
                  <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.ndaInfo.includes(o.value)} onChange={() => toggleNdaInfo(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="contrato-form-section">2. Modalidade e Seguro/Garantia</h4>
          <div style={{ display: 'grid', gridTemplateColumns: form.modalidade === 'aditivo' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <Select label="Modalidade do Contrato" value={form.modalidade} onChange={set('modalidade')}>
              {MODALIDADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {form.modalidade === 'aditivo' && (
              <Input label="Número do Contrato Original" value={form.contratoOriginal} onChange={set('contratoOriginal')} placeholder="Ex: SEN-1000" />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: form.seguroGarantia === 'sim' ? '1fr 1fr' : '1fr', gap: 12, marginTop: 12 }}>
            <Select label="Seguros/Garantia" value={form.seguroGarantia} onChange={set('seguroGarantia')}>
              {SEGURO_GARANTIA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {form.seguroGarantia === 'sim' && (
              <Select label="Tipo de Seguro/Garantia" value={form.tipoSeguro} onChange={set('tipoSeguro')}>
                <option value="">Selecione...</option>
                {TIPO_SEGURO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            )}
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">3. Minutagem</h4>
          <div style={{ display: 'grid', gridTemplateColumns: form.minutagem === 'padrao_cliente' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <Select label="Minutagem" value={form.minutagem} onChange={set('minutagem')}>
              {MINUTAGEM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {form.minutagem === 'padrao_cliente' && (
              <AnexoField label="Anexo da Minuta do Cliente" value={form.anexoMinuta} onChange={set('anexoMinuta')} required />
            )}
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">4. Cliente/Fornecedor</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: 12 }}>
            <Input label="Nome do Cliente/Fornecedor *" value={form.clienteNome} onChange={set('clienteNome')} />
            <Input label="CNPJ *" value={form.clienteCnpj} onChange={set('clienteCnpj')} placeholder="00.000.000/0000-00" />
            <Input label="E-mail" type="email" value={form.clienteEmail} onChange={set('clienteEmail')} />
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">5. Assinatura</h4>
          <div style={{ display: 'grid', gridTemplateColumns: form.assinante === 'procurador' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <Select label="Quem Assinará o Contrato" value={form.assinante} onChange={set('assinante')}>
              {ASSINANTE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {form.assinante === 'procurador' && (
              <AnexoField label="Anexo da Procuração" value={form.anexoProcuracao} onChange={set('anexoProcuracao')} />
            )}
          </div>
        </div>

        <div>
          <h4 className="contrato-form-section">6. Solicitação</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input type="date" label="Data de Solicitação" value={form.dataSolicitacao} onChange={set('dataSolicitacao')} />
            <Input label="Solicitante *" value={form.solicitante} onChange={set('solicitante')} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Textarea label="Observações" value={form.observacoes} onChange={set('observacoes')} rows={3} />
          </div>
          <div style={{ marginTop: 12 }}>
            <AnexoField label="Anexo da Proposta Comercial" value={form.anexoPropostaComercial} onChange={set('anexoPropostaComercial')} />
          </div>
        </div>

      </div>
    </Modal>
  )
}
