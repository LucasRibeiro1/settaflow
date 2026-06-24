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
  const atrasoMedio = cliente.atrasoMedio ?? 0
  const somaValorVencido = cliente.somaValorVencido ?? 0
  const somaValorDiasAtraso = cliente.somaValorDiasAtraso ?? 0

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

        {/* Índice de Atraso Ponderado */}
        <div className={`resumo-kpi ${atrasoMedio > 9000 ? 'resumo-kpi-danger' : atrasoMedio > 3000 ? 'resumo-kpi-warning' : 'resumo-kpi-info'}`}>
          <span className="resumo-kpi-label">Índice de Atraso Ponderado</span>
          <span className="resumo-kpi-value">
            {atrasoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </span>
          <span className="resumo-kpi-sub">
            Saldo em atraso: {formatCurrency(somaValorVencido)}
          </span>
        </div>

        {/* Fórmula */}
        <div className="resumo-kpi resumo-kpi-formula">
          <span className="resumo-kpi-label">Fórmula Aplicada</span>
          <div className="formula-block">
            <span className="formula-text">
              % = <span className="formula-num">Σ (Valor × Dias de Atraso)</span>
              <span className="formula-div"> / </span>
              <span className="formula-den">Σ (Valor dos Títulos em Atraso)</span>
              <span> × 100</span>
            </span>
            <div className="formula-calc">
              = {somaValorDiasAtraso.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {formatCurrency(somaValorVencido)} × 100
              = <strong>{atrasoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</strong>
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
