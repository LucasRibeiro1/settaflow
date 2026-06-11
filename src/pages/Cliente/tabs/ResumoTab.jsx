import { useState } from 'react'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../context/ToastContext'
import { formatCurrency, formatCNPJ } from '../../../utils/formatters'
import './ResumoTab.css'

function InfoField({ label, value }) {
  return (
    <div className="info-field">
      <span className="info-field-label">{label}</span>
      <span className="info-field-value">{value || '—'}</span>
    </div>
  )
}

export function ResumoTab({ cliente }) {
  const { addToast } = useToast()
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '')
  const [saving, setSaving] = useState(false)

  const saldoDisponivel = cliente.limiteCredito - cliente.valorTotalAberto
  const percentualPagoEmDia =
    cliente.percAdimplencia > 0
      ? parseFloat(cliente.percAdimplencia).toFixed(1)
      : cliente.valorTotalEmitido > 0
        ? ((cliente.valorPagoEmDia / cliente.valorTotalEmitido) * 100).toFixed(1)
        : '0.0'

  const handleSaveObs = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    addToast('Observações salvas com sucesso.', 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPIs financeiros */}
      <div className="resumo-kpi-row">
        {/* Saldo Disponível */}
        <div className={`resumo-kpi ${saldoDisponivel < 0 ? 'resumo-kpi-danger' : 'resumo-kpi-success'}`}>
          <span className="resumo-kpi-label">Saldo Disponível</span>
          <span className="resumo-kpi-value">{formatCurrency(saldoDisponivel)}</span>
          <span className="resumo-kpi-sub">
            Limite {formatCurrency(cliente.limiteCredito)} − Em aberto {formatCurrency(cliente.valorTotalAberto)}
          </span>
        </div>

        {/* % Pago em Dia */}
        <div className="resumo-kpi resumo-kpi-info">
          <span className="resumo-kpi-label">% Títulos Pagos em Dia</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span className="resumo-kpi-value">{percentualPagoEmDia}%</span>
            <div className="resumo-progress-bar-wrap">
              <div
                className="resumo-progress-bar"
                style={{
                  width: `${Math.min(parseFloat(percentualPagoEmDia), 100)}%`,
                  background: parseFloat(percentualPagoEmDia) >= 80
                    ? 'var(--success)'
                    : parseFloat(percentualPagoEmDia) >= 60
                      ? 'var(--warning)'
                      : 'var(--danger)',
                }}
              />
            </div>
          </div>
          <span className="resumo-kpi-sub">
            {formatCurrency(cliente.valorPagoEmDia)} de {formatCurrency(cliente.valorTotalEmitido)} emitidos
          </span>
        </div>

        {/* Fórmula */}
        <div className="resumo-kpi resumo-kpi-formula">
          <span className="resumo-kpi-label">Fórmula Aplicada</span>
          <div className="formula-block">
            <span className="formula-text">
              % = <span className="formula-num">Σ Valor Pago em Dia</span>
              <span className="formula-div"> / </span>
              <span className="formula-den">Σ Valor Total Emitido</span>
              <span> × 100</span>
            </span>
            <div className="formula-calc">
              = {formatCurrency(cliente.valorPagoEmDia)} / {formatCurrency(cliente.valorTotalEmitido)} × 100
              = <strong>{percentualPagoEmDia}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Dados cadastrais + Contatos */}
      <div className="grid grid-2" style={{ gap: 20 }}>
        <Card>
          <CardHeader title="Dados Cadastrais" />
          <div className="info-grid">
            <InfoField label="Razão Social" value={cliente.razaoSocial} />
            <InfoField label="Nome Fantasia" value={cliente.nomeFantasia} />
            <InfoField label="CNPJ" value={formatCNPJ(cliente.cnpj)} />
            <InfoField label="Grupo" value={cliente.grupoCliente} />
            <InfoField label="Cidade" value={cliente.cidade} />
            <InfoField label="UF" value={cliente.uf} />
            <InfoField label="Região" value={cliente.regiao} />
            <InfoField label="Vendedor" value={cliente.vendedor} />
            <InfoField label="Responsável Cobrança" value={cliente.responsavelCobranca} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Contatos" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="info-field-label">Telefones</span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cliente.telefones?.map((tel, i) => (
                  <a
                    key={i}
                    href={`tel:${tel}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', background: 'var(--bg)',
                      borderRadius: 6, border: '1px solid var(--border)',
                      color: 'var(--primary)', fontSize: '0.825rem', fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    📞 {tel}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <span className="info-field-label">E-mails</span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cliente.emails?.map((email, i) => (
                  <a
                    key={i}
                    href={`mailto:${email}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', background: 'var(--bg)',
                      borderRadius: 6, border: '1px solid var(--border)',
                      color: 'var(--primary)', fontSize: '0.825rem', fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    📧 {email}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Observações editáveis */}
      <Card>
        <CardHeader
          title="Observações"
          actions={
            <Button variant="primary" size="sm" onClick={handleSaveObs} loading={saving}>
              Salvar
            </Button>
          }
        />
        <textarea
          className="obs-textarea"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Digite observações sobre este cliente..."
          rows={5}
        />
      </Card>
    </div>
  )
}
