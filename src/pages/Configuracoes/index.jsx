import { useState, useEffect } from 'react'
import { Header } from '../../layouts/Header'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { authService } from '../../services/authService'

function initialsFromName(nome) {
  if (!nome) return '?'
  return nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    authService.getUsuarios()
      .then((data) => setUsuarios(data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoadingUsers(false))
  }, [])

  return (
    <>
      <Header
        title="Configurações"
        subtitle="Parâmetros do sistema de cobrança"
        breadcrumb={<Breadcrumb items={[{ to: '/dashboard', label: 'Dashboard' }, { label: 'Configurações' }]} />}
      />
      <div className="page-content fade-in">
        <div className="grid grid-2" style={{ gap: 20 }}>
          <Card>
            <CardHeader title="Parâmetros de Cobrança" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Dias sem contato para alerta" type="number" defaultValue={30} />
              <Input label="Dias para considerar cliente crítico" type="number" defaultValue={90} />
              <Select label="Responsável padrão (novos clientes)">
                <option>Ana Costa</option>
                <option>João Lima</option>
              </Select>
              <Input label="E-mail para notificações" type="email" defaultValue="cobranca@empresa.com.br" />
              <Button variant="primary" size="sm" style={{ alignSelf: 'flex-end' }}>Salvar Parâmetros</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Integração com API" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="URL da API" defaultValue={import.meta.env.VITE_API_URL || 'http://localhost:8080/api'} />
              <Select label="Modo de operação">
                <option value="mock">Dados simulados (desenvolvimento)</option>
                <option value="api">API REST (produção)</option>
              </Select>
              <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 8 }}>
                <p style={{ fontSize: '0.775rem', color: '#065f46' }}>
                  ✓ Sistema operando com dados simulados. Configure a URL da API e altere o modo para integrar com ERP/Protheus.
                </p>
              </div>
              <Button variant="primary" size="sm" style={{ alignSelf: 'flex-end' }}>Salvar e Testar Conexão</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Usuários e Perfis" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingUsers && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carregando usuários...</p>
              )}
              {!loadingUsers && usuarios.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</p>
              )}
              {usuarios.map((u, i) => {
                const cod    = u.cCod    || u.USR_COD  || ''
                const nome   = u.cNome   || u.USR_NOME || u.nome || String(i)
                const email  = u.cEmail  || u.USR_EMAIL|| u.email|| ''
                const depto  = u.cDepto  || u.depto    || ''
                const cargo  = u.cCargo  || u.cargo    || ''
                return (
                  <div key={cod || i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: 'var(--bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 42, height: 42, background: 'var(--primary)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {initialsFromName(nome)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{nome}</p>
                        {cod && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 4, padding: '1px 6px',
                          }}>
                            #{cod}
                          </span>
                        )}
                      </div>
                      {email && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 2 }}>{email}</p>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {cargo && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--primary-50)', borderRadius: 4, padding: '2px 7px',
                          }}>
                            {cargo}
                          </span>
                        )}
                        {depto && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 500,
                            color: 'var(--text-muted)',
                          }}>
                            {depto}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notificações" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Clientes sem contato há mais de 30 dias',
                'Promessa de pagamento vencida',
                'Novo cliente na carteira',
                'Acordo quebrado',
                'Meta de recuperação atingida',
              ].map((item) => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.825rem' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  {item}
                </label>
              ))}
              <Button variant="primary" size="sm" style={{ alignSelf: 'flex-end', marginTop: 8 }}>Salvar Preferências</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
