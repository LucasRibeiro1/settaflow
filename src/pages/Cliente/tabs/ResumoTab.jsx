import { useState } from 'react'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../context/ToastContext'
import { clienteService } from '../../../services/clienteService'
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
  const [contatoFin, setContatoFin] = useState({
    telefone: cliente.telefoneFinanceiro || '',
    email: cliente.emailFinanceiro || '',
  })
  const [savingFin, setSavingFin] = useState(false)

  const saldoDisponivel = cliente.limiteCredito - cliente.valorTotalAberto
  const atrasoMedio = cliente.atrasoMedio ?? 0
  const somaValorVencido = cliente.somaValorVencido ?? 0
  const somaValorDiasAtraso = cliente.somaValorDiasAtraso ?? 0

  const handleSaveContatoFin = async () => {
    setSavingFin(true)
    try {
      await clienteService.alterarContatoFinanceiro(cliente.codigo, cliente.loja, contatoFin)
      addToast('Contato financeiro salvo com sucesso.', 'success')
    } catch {
      addToast('Erro ao salvar contato financeiro.', 'error')
    } finally {
      setSavingFin(false)
    }
  }

  const handleSaveObs = async () => {
    setSaving(true)
    try {
      await clienteService.alterarObservacao(cliente.codigo, cliente.loja, observacoes)
      addToast('Observações salvas com sucesso.', 'success')
    } catch {
      addToast('Erro ao salvar observações.', 'error')
    } finally {
      setSaving(false)
    }
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
              <span className="formula-den">(Σ Valor em Atraso × 100)</span>
            </span>
            <div className="formula-calc">
              = {somaValorDiasAtraso.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / ({formatCurrency(somaValorVencido)} × 100)
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
          <CardHeader title="Contato Comercial" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="info-field-label">Telefones</span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cliente.telefones?.length ? cliente.telefones.map((tel, i) => (
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
                )) : <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>—</span>}
              </div>
            </div>
            <div>
              <span className="info-field-label">E-mails</span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cliente.emails?.length ? cliente.emails.map((email, i) => (
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
                )) : <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>—</span>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Contato Financeiro editável */}
      <Card>
        <CardHeader
          title="Contato Financeiro"
          actions={
            <Button variant="primary" size="sm" onClick={handleSaveContatoFin} loading={savingFin}>
              Salvar
            </Button>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span className="info-field-label">Telefone</span>
            <input
              type="tel"
              className="obs-textarea"
              style={{ marginTop: 6, height: 'auto', padding: '8px 12px', resize: 'none', fontFamily: 'inherit' }}
              value={contatoFin.telefone}
              onChange={(e) => setContatoFin((p) => ({ ...p, telefone: e.target.value }))}
              placeholder="Ex: (62) 99999-0000"
            />
          </div>
          <div>
            <span className="info-field-label">E-mail</span>
            <input
              type="email"
              className="obs-textarea"
              style={{ marginTop: 6, height: 'auto', padding: '8px 12px', resize: 'none', fontFamily: 'inherit' }}
              value={contatoFin.email}
              onChange={(e) => setContatoFin((p) => ({ ...p, email: e.target.value }))}
              placeholder="Ex: financeiro@empresa.com.br"
            />
          </div>
        </div>
      </Card>

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
