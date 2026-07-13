import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../layouts/Header'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select, Textarea, Input } from '../../components/ui/Input'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { useApi } from '../../hooks/useApi'
import { dashboardService } from '../../services/dashboardService'
import { tratativaService } from '../../services/tratativaService'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate, PRIORIDADE_LABELS, PRIORIDADE_COLORS, STATUS_LABELS, TIPO_CONTATO_LABELS, ACORDO_STATUS_LABELS, ACORDO_STATUS_COLORS } from '../../utils/formatters'
import './MinhaFila.css'

const PRIORIDADE_ORDER = { critica: 0, alta: 1, media: 2, baixa: 3 }

export default function MinhaFila() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('cobranca')
  const [activeItem, setActiveItem] = useState(null)
  const [form, setForm] = useState({
    tipoContato: 'ligacao',
    status: 'em_cobranca',
    observacao: '',
    proximaAcao: '',
    dataProximaAcao: '',
  })
  const [saving, setSaving] = useState(false)

  const { data: fila, loading: loadingFila } = useApi(() => dashboardService.getFilaTrabalho(), [])
  const { data: acordosHoje, loading: loadingAcordos } = useApi(() => dashboardService.getAcordosHoje(), [])
  const { data: vencHoje, loading: loadingVenc } = useApi(() => dashboardService.getTitulosVencendoHoje(), [])

  const handleRegistrar = async () => {
    if (!form.observacao.trim()) {
      addToast('Informe a observação.', 'warning')
      return
    }
    setSaving(true)
    try {
      await tratativaService.createTratativa({
        clienteId: activeItem.clienteId,
        clienteNome: activeItem.clienteNome,
        clienteCodigo: activeItem.clienteCodigo,
        usuario: 'Ana Costa',
        dataHora: new Date().toISOString(),
        ...form,
      })
      addToast('Contato registrado com sucesso!', 'success')
      setActiveItem(null)
      setForm({ tipoContato: 'ligacao', status: 'em_cobranca', observacao: '', proximaAcao: '', dataProximaAcao: '' })
    } catch {
      addToast('Erro ao registrar contato.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const hoje = new Date().toLocaleDateString('pt-BR')
  const sortedFila = [...(fila || [])].sort(
    (a, b) => (PRIORIDADE_ORDER[a.prioridade] ?? 9) - (PRIORIDADE_ORDER[b.prioridade] ?? 9)
  )

  return (
    <>
      <Header
        title="Minha Fila"
        subtitle={`Contatos agendados para hoje · ${hoje}`}
        breadcrumb={<Breadcrumb items={[{ to: '/dashboard', label: 'Dashboard' }, { label: 'Minha Fila' }]} />}
      />
      <div className="page-content fade-in">

        {/* Abas */}
        <div className="tabs-bar" style={{ marginBottom: 16 }}>
          <button
            className={`tab-btn ${activeTab === 'cobranca' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('cobranca')}
          >
            Fila de Cobrança
            {fila?.length ? (
              <span style={{ marginLeft: 6, background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {fila.length}
              </span>
            ) : null}
          </button>
          <button
            className={`tab-btn ${activeTab === 'acordos' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('acordos')}
          >
            Acordos Hoje
            {acordosHoje?.length ? (
              <span style={{ marginLeft: 6, background: '#8b5cf6', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {acordosHoje.length}
              </span>
            ) : null}
          </button>
          <button
            className={`tab-btn ${activeTab === 'vencendo' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('vencendo')}
          >
            Vencimentos Hoje
            {vencHoje?.length ? (
              <span style={{ marginLeft: 6, background: 'var(--warning)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                {vencHoje.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* ── Tab 1: Fila de Cobrança ── */}
        {activeTab === 'cobranca' && (
          loadingFila ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando fila...</div>
          ) : !sortedFila.length ? (
            <Card>
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '3rem', marginBottom: 12 }}>✅</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum contato agendado para hoje.</p>
                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  Ao registrar uma tratativa com "Próxima Ação" datada para hoje, o cliente aparece aqui.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge type="danger">{sortedFila.filter((f) => f.prioridade === 'critica').length} Críticos (+180d)</Badge>
                <Badge type="warning">{sortedFila.filter((f) => f.prioridade === 'alta').length} Alta (91-180d)</Badge>
                <Badge type="info">{sortedFila.filter((f) => f.prioridade === 'media').length} Média (31-90d)</Badge>
                <Badge type="default">{sortedFila.filter((f) => f.prioridade === 'baixa').length} Baixa (1-30d)</Badge>
              </div>

              <div className="fila-list">
                {sortedFila.map((item) => (
                  <Card key={item.id} className={`fila-card fila-card-${item.prioridade}`} hoverable>
                    <div className="fila-card-content">
                      <div className={`fila-prioridade-bar fila-bar-${item.prioridade}`} />
                      <div className="fila-info">
                        <div className="fila-header">
                          <div>
                            <span className="fila-codigo">
                              {item.filial && <span style={{ marginRight: 6, color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.filial}</span>}
                              {item.clienteCodigo}
                              {item.grupoCliente && item.grupoCliente !== '—' && (
                                <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'var(--primary-50)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4 }}>
                                  {item.grupoCliente}
                                </span>
                              )}
                            </span>
                            <h3 className="fila-nome">{item.clienteNome}</h3>
                            {item.clienteNome2 && item.clienteNome2 !== item.clienteNome && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.clienteNome2}</span>
                            )}
                          </div>
                          <Badge type={PRIORIDADE_COLORS[item.prioridade] || 'default'}>
                            {PRIORIDADE_LABELS[item.prioridade]}
                          </Badge>
                        </div>

                        <div className="fila-details">
                          <div className="fila-detail">
                            <span className="fila-detail-label">Valor em Aberto</span>
                            <span className="fila-detail-value fila-valor">{formatCurrency(item.valorAberto)}</span>
                          </div>
                          <div className="fila-detail">
                            <span className="fila-detail-label">Títulos Vencidos</span>
                            <span className="fila-detail-value">{item.qtdTitulos}</span>
                          </div>
                          <div className="fila-detail">
                            <span className="fila-detail-label">Maior Atraso</span>
                            <span className="fila-detail-value">
                              <Badge type={item.maiorAtraso > 180 ? 'danger' : item.maiorAtraso > 90 ? 'warning' : 'info'}>
                                {item.maiorAtraso}d
                              </Badge>
                            </span>
                          </div>
                          <div className="fila-detail">
                            <span className="fila-detail-label">Próxima Ação</span>
                            <span className="fila-detail-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                              {item.proximaAcao}
                            </span>
                          </div>
                        </div>

                        <div className="fila-actions">
                          <Button variant="primary" size="sm" onClick={() => setActiveItem(item)}>
                            📞 Registrar Contato
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/carteira/${item.clienteId}`)}>
                            Ver cliente →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )
        )}

        {/* ── Tab 2: Acordos Hoje ── */}
        {activeTab === 'acordos' && (
          loadingAcordos ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando acordos...</div>
          ) : !acordosHoje?.length ? (
            <Card>
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '3rem', marginBottom: 12 }}>🤝</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum acordo com parcela para hoje.</p>
                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  Acordos com 1ª parcela vencendo em {hoje} aparecerão aqui.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <Badge type="info">
                  {acordosHoje.length} acordo{acordosHoje.length !== 1 ? 's' : ''} com parcela hoje ·{' '}
                  {formatCurrency(acordosHoje.reduce((s, a) => s + a.valorNegociado, 0))} em negociação
                </Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {acordosHoje.map((a) => (
                  <Card key={a.id} hoverable>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => navigate(`/carteira/${a.clienteId}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit' }}
                          >
                            {a.clienteNome}
                          </button>
                          {a.clienteNome2 && a.clienteNome2 !== a.clienteNome && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.clienteNome2}</span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.clienteCodigo}</span>
                          {a.grupoCliente && a.grupoCliente !== '—' && (
                            <span style={{ fontSize: '0.7rem', background: 'var(--primary-50)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4 }}>
                              {a.grupoCliente}
                            </span>
                          )}
                          <Badge type={ACORDO_STATUS_COLORS[a.status] || 'default'}>
                            {ACORDO_STATUS_LABELS[a.status] || a.status}
                          </Badge>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, auto))', gap: '10px 28px' }}>
                          {[
                            ['Valor Negociado', formatCurrency(a.valorNegociado)],
                            ['Parcelas', `${a.qtdParcelas}x de ${formatCurrency(a.valorParcela)}`],
                            ['1ª Parcela', formatDate(a.vencimentoPrimeiraParcela)],
                            ['Data do Acordo', formatDate(a.dataAcordo)],
                            ['Saldo em Aberto', formatCurrency(a.valorAberto)],
                          ].map(([label, val]) => (
                            <div key={label}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                              <p style={{ fontWeight: 600, fontSize: '0.825rem', marginTop: 2 }}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {a.observacoes && (
                          <p style={{ marginTop: 10, fontSize: '0.775rem', color: 'var(--text-muted)' }}>{a.observacoes}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/carteira/${a.clienteId}`)}>
                        Ver cliente →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )
        )}

        {/* ── Tab 3: Vencimentos Hoje ── */}
        {activeTab === 'vencendo' && (
          loadingVenc ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Buscando vencimentos...</div>
          ) : !vencHoje?.length ? (
            <Card>
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '3rem', marginBottom: 12 }}>📅</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum título vence hoje.</p>
                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>Não há títulos com vencimento em {hoje}.</p>
              </div>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <Badge type="warning">
                  {vencHoje.length} título{vencHoje.length !== 1 ? 's' : ''} venc{vencHoje.length !== 1 ? 'em' : 'e'} hoje ·{' '}
                  {formatCurrency(vencHoje.reduce((s, t) => s + t.saldoAtual, 0))} em risco
                </Badge>
              </div>

              <Card padding={false}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr>
                        <th>Filial</th>
                        <th>Código</th>
                        <th>Cliente</th>
                        <th>Grupo</th>
                        <th>Prefixo</th>
                        <th>Título</th>
                        <th>Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor</th>
                        <th>Saldo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vencHoje.map((t) => (
                        <tr
                          key={t.id}
                          className="row-clickable"
                          onClick={() => navigate(`/carteira/${t.clienteId}`)}
                        >
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filial}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>{t.clienteCodigo}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.clienteNome}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{t.grupoCliente}</td>
                          <td>{t.prefixo}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.titulo}</td>
                          <td>{t.parcela}</td>
                          <td>
                            <Badge type="warning">{formatDate(t.vencimento)}</Badge>
                          </td>
                          <td>{formatCurrency(t.valorOriginal)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(t.saldoAtual)}</td>
                          <td>
                            <button className="table-action-btn" style={{ fontSize: '0.7rem' }}>Ver →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--bg)' }}>
                        <td colSpan={8} style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.8rem' }}>
                          Total vencendo hoje
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 700 }}>
                          {formatCurrency(vencHoje.reduce((s, t) => s + t.valorOriginal, 0))}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--danger)' }}>
                          {formatCurrency(vencHoje.reduce((s, t) => s + t.saldoAtual, 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </>
          )
        )}
      </div>

      {/* Modal de registro de contato */}
      <Modal
        open={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={`Registrar Contato — ${activeItem?.clienteNome}`}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setActiveItem(null)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleRegistrar} loading={saving}>Registrar</Button>
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
              label="Resultado"
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
            placeholder="O que aconteceu neste contato?"
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
    </>
  )
}
