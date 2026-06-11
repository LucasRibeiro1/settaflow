import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { useApi } from '../../../hooks/useApi'
import { clienteService } from '../../../services/clienteService'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { SkeletonTable } from '../../../components/ui/Skeleton'

export function FinanceiroTab({ clienteId, cliente }) {
  const { data: titulos, loading } = useApi(
    () => clienteService.getTitulosCliente(clienteId),
    [clienteId]
  )

  const totalAberto = titulos?.reduce((s, t) => s + t.saldoAtual, 0) || 0

  return (
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
        <SkeletonTable rows={5} cols={9} />
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
                </tr>
              </thead>
              <tbody>
                {titulos.map((t) => (
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
                  </tr>
                ))}
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
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
