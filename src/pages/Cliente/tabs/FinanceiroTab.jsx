import { useState, useMemo } from 'react'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { Input, Select } from '../../../components/ui/Input'
import { useApi } from '../../../hooks/useApi'
import { clienteService } from '../../../services/clienteService'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { SkeletonTable } from '../../../components/ui/Skeleton'

const INADIMPLENCIA_OPTIONS = [
  { value: '', label: '— Sem classificação —' },
  { value: 'normal', label: 'Normal' },
  { value: 'externa', label: 'Externa' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'sem_classificacao', label: 'Sem Classificação' },
]

const MOTIVO_OPTIONS = [
  { value: '', label: '— Sem motivo —' },
  { value: 'setta', label: 'Setta' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'sem_motivo', label: 'Sem Motivo' },
]

const INADIM_BADGE = {
  normal: 'success',
  externa: 'warning',
  juridico: 'danger',
  sem_classificacao: 'default',
}

const INADIM_LABEL = {
  normal: 'Normal',
  externa: 'Externa',
  juridico: 'Jurídico',
  sem_classificacao: 'Sem Class.',
}

const MOTIVO_LABEL = {
  setta: 'Setta',
  cliente: 'Cliente',
  sem_motivo: 'Sem Motivo',
}

const CALC_DEFAULTS = { percDiario: '0.10', percFixo: '2.00', valorProduto: '0', diasPatio: '0' }

export function FinanceiroTab({ clienteId, cliente }) {
  const { data: titulos, loading } = useApi(
    () => clienteService.getTitulosCliente(clienteId),
    [clienteId]
  )

  const [overrides, setOverrides] = useState({})
  const [editModal, setEditModal] = useState(null)
  const [editVals, setEditVals] = useState({ inadimplencia: '', motivo: '' })
  const [calcModal, setCalcModal] = useState(null)
  const [calcVals, setCalcVals] = useState(CALC_DEFAULTS)

  const totalAberto = titulos?.reduce((s, t) => s + t.saldoAtual, 0) || 0

  function openEdit(t) {
    const ov = overrides[t.id] || {}
    setEditVals({
      inadimplencia: ov.inadimplencia ?? t.inadimplencia ?? '',
      motivo: ov.motivo ?? t.motivo ?? '',
    })
    setEditModal(t)
  }

  function saveEdit() {
    setOverrides((prev) => ({ ...prev, [editModal.id]: { ...editVals } }))
    setEditModal(null)
  }

  function openCalc(t) {
    setCalcModal(t)
  }

  const calc = useMemo(() => {
    if (!calcModal) return null
    const perc = parseFloat(calcVals.percDiario) || 0
    const percMulta = parseFloat(calcVals.percFixo) || 0
    const valProd = parseFloat(calcVals.valorProduto) || 0
    const dias = parseFloat(calcVals.diasPatio) || 0
    const saldo = Math.abs(calcModal.saldoAtual)
    const juros = saldo * (calcModal.diasAtraso * perc / 100)
    const multa = saldo * (percMulta / 100)
    const locacao = valProd * dias
    return { juros, multa, locacao, total: juros + multa + locacao }
  }, [calcModal, calcVals])

  function getTituloField(t, field) {
    return overrides[t.id]?.[field] ?? t[field] ?? ''
  }

  return (
    <>
      <Card padding={false}>
        <CardHeader
          title="Títulos Vencidos"
          subtitle={
            cliente
              ? `${cliente.razaoSocial} · ${cliente.nomeFantasia} · ${cliente.codigo}`
              : 'Documentos em aberto — apenas consulta'
          }
        />
        {cliente && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '10px 20px',
            background: 'var(--primary-50)',
            borderBottom: '1px solid var(--primary-100)',
            flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>{cliente.razaoSocial}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fantasia</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 1 }}>{cliente.nomeFantasia}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</span>
              <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>{cliente.codigo}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CNPJ</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 1 }}>{cliente.cnpj}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cidade/UF</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 1 }}>{cliente.cidade}/{cliente.uf}</p>
            </div>
          </div>
        )}
        {loading ? (
          <SkeletonTable rows={5} cols={11} />
        ) : !titulos?.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum título encontrado.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>Filial</th>
                    <th>Prefixo</th>
                    <th>Título</th>
                    <th>Parcela</th>
                    <th>Tipo</th>
                    <th>Emissão</th>
                    <th>Vencimento</th>
                    <th>Venc. Real</th>
                    <th>Atraso</th>
                    <th>Valor Original</th>
                    <th>Saldo Atual</th>
                    <th>Inadimplência</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {titulos.map((t) => {
                    const inadim = getTituloField(t, 'inadimplencia')
                    const motivo = getTituloField(t, 'motivo')
                    return (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filial}</td>
                        <td>{t.prefixo}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.titulo}</td>
                        <td>{t.parcela}</td>
                        <td>{t.tipo}</td>
                        <td>{formatDate(t.emissao)}</td>
                        <td>{formatDate(t.vencimentoOriginal || t.vencimento)}</td>
                        <td style={{ color: t.vencimentoReal ? 'var(--warning)' : 'var(--text-muted)', fontWeight: t.vencimentoReal ? 600 : 400 }}>
                          {t.vencimentoReal ? formatDate(t.vencimentoReal) : '—'}
                        </td>
                        <td>
                          {t.diasAtraso > 0 ? (
                            <Badge type={t.diasAtraso > 90 ? 'danger' : t.diasAtraso > 30 ? 'warning' : 'info'}>
                              {t.diasAtraso}d
                            </Badge>
                          ) : (
                            <Badge type="success">No prazo</Badge>
                          )}
                        </td>
                        <td>{formatCurrency(t.valorOriginal)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(t.saldoAtual)}</td>
                        <td>
                          {inadim
                            ? <Badge type={INADIM_BADGE[inadim] || 'default'}>{INADIM_LABEL[inadim] || inadim}</Badge>
                            : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          }
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {MOTIVO_LABEL[motivo] || (motivo || '—')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              title="Editar classificação"
                              onClick={() => openEdit(t)}
                              style={{
                                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                                padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem',
                                color: 'var(--text-secondary)', transition: 'var(--transition)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                            >
                              ✏️
                            </button>
                            <button
                              title="Calculadora de juros"
                              onClick={() => openCalc(t)}
                              style={{
                                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                                padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem',
                                color: 'var(--text-secondary)', transition: 'var(--transition)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--warning-50, #fffbeb)'; e.currentTarget.style.borderColor = 'var(--warning)'; e.currentTarget.style.color = 'var(--warning)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                            >
                              🧮
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg)' }}>
                    <td colSpan={9} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.8rem' }}>
                      Total em Aberto
                    </td>
                    <td />
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--danger)', fontSize: '0.875rem' }}>
                      {formatCurrency(totalAberto)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Modal: Editar classificação */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Editar Classificação"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Button>
            <Button variant="primary" onClick={saveEdit}>Salvar</Button>
          </div>
        }
      >
        {editModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{editModal.titulo}</strong>
              {editModal.parcela ? ` / ${editModal.parcela}` : ''}
              {' · '}Venc. {formatDate(editModal.vencimentoOriginal || editModal.vencimento)}
              {' · '}{formatCurrency(editModal.saldoAtual)}
            </div>
            <Select
              label="Inadimplência"
              value={editVals.inadimplencia}
              onChange={(e) => setEditVals((v) => ({ ...v, inadimplencia: e.target.value }))}
            >
              {INADIMPLENCIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select
              label="Motivo"
              value={editVals.motivo}
              onChange={(e) => setEditVals((v) => ({ ...v, motivo: e.target.value }))}
            >
              {MOTIVO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        )}
      </Modal>

      {/* Modal: Calculadora */}
      <Modal
        open={!!calcModal}
        onClose={() => setCalcModal(null)}
        title="Calculadora de Juros, Multa e Locação"
        size="md"
        footer={
          <Button variant="ghost" onClick={() => setCalcModal(null)}>Fechar</Button>
        }
      >
        {calcModal && calc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Referência do título */}
            <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>Título:</strong> {calcModal.titulo}{calcModal.parcela ? `/${calcModal.parcela}` : ''}</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Atraso:</strong> {calcModal.diasAtraso}d</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Saldo:</strong> {formatCurrency(calcModal.saldoAtual)}</span>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Percentual Diário de Juros (%)"
                type="number"
                step="0.01"
                min="0"
                value={calcVals.percDiario}
                onChange={(e) => setCalcVals((v) => ({ ...v, percDiario: e.target.value }))}
              />
              <Input
                label="Percentual Fixo de Multa (%)"
                type="number"
                step="0.01"
                min="0"
                value={calcVals.percFixo}
                onChange={(e) => setCalcVals((v) => ({ ...v, percFixo: e.target.value }))}
              />
              <Input
                label="Valor do Produto (R$)"
                type="number"
                step="0.01"
                min="0"
                value={calcVals.valorProduto}
                onChange={(e) => setCalcVals((v) => ({ ...v, valorProduto: e.target.value }))}
              />
              <Input
                label="Dias de Pátio"
                type="number"
                step="1"
                min="0"
                value={calcVals.diasPatio}
                onChange={(e) => setCalcVals((v) => ({ ...v, diasPatio: e.target.value }))}
              />
            </div>

            {/* Resultados */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CalcRow
                label="Juros"
                formula={`${formatCurrency(Math.abs(calcModal.saldoAtual))} × ${calcModal.diasAtraso}d × ${calcVals.percDiario}%`}
                value={calc.juros}
              />
              <CalcRow
                label="Multa"
                formula={`${formatCurrency(Math.abs(calcModal.saldoAtual))} × ${calcVals.percFixo}%`}
                value={calc.multa}
              />
              <CalcRow
                label="Locação Pátio"
                formula={`${formatCurrency(parseFloat(calcVals.valorProduto) || 0)} × ${calcVals.diasPatio}d`}
                value={calc.locacao}
              />
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--danger)' }}>{formatCurrency(calc.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function CalcRow({ label, formula, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <div>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>{formula}</span>
      </div>
      <span style={{ fontWeight: 700, color: value > 0 ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.9rem', minWidth: 110, textAlign: 'right' }}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
