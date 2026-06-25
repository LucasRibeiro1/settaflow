import { mockDashboard } from '../mocks/dashboard'
import { clienteService } from './clienteService'
import { tituloService } from './tituloService'
import { tratativaService } from './tratativaService'
import { acordoService } from './acordoService'
import { computeDashboard } from '../utils/apiMappers'

const USE_MOCK = false

function derivaPrioridade(maiorAtraso) {
  if (maiorAtraso > 180) return 'critica'
  if (maiorAtraso > 90)  return 'alta'
  if (maiorAtraso > 30)  return 'media'
  return 'baixa'
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth()    === d2.getMonth()    &&
    d1.getDate()     === d2.getDate()
  )
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const dashboardService = {
  async getDashboard() {
    if (USE_MOCK) return mockDashboard

    const [clientes, titulos] = await Promise.all([
      clienteService.getClientesEnriched(),
      tituloService.getTitulosRaw(),
    ])

    return computeDashboard(clientes, titulos)
  },

  // Fila de cobrança: tratativas com DTPROX = hoje (busca global com range de clientes)
  async getFilaTrabalho() {
    const hoje = todayStr()

    const [tratativas, clientes] = await Promise.all([
      tratativaService.getTratativas(),
      clienteService.getClientesEnriched(),
    ])

    const hojeTratativas = tratativas.filter((t) => t.dataProximaAcao === hoje)
    if (!hojeTratativas.length) return []

    // Mapa de clientes por id e por código para enriquecer com dados financeiros
    const clienteMap = {}
    for (const c of clientes) {
      clienteMap[c.id] = c
      if (c.codigo) clienteMap[c.codigo] = c
    }

    const seen = new Set()
    return hojeTratativas
      .filter((t) => {
        const key = String(t.clienteId)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((t) => {
        const c = clienteMap[t.clienteId] || clienteMap[t.clienteCodigo] || {}
        return {
          id: t.id,
          clienteId: t.clienteId,
          clienteNome: t.clienteNome || c.razaoSocial || t.clienteCodigo,
          clienteNome2: c.nomeFantasia || '',
          clienteCodigo: t.clienteCodigo || c.codigo || '',
          filial: c.filial || '',
          grupoCliente: c.grupoCliente || '—',
          valorAberto: c.valorTotalAberto || 0,
          qtdTitulos: c.qtdTitulosVencidos || 0,
          maiorAtraso: c.maiorAtraso || 0,
          proximaAcao: t.proximaAcao || '—',
          prioridade: derivaPrioridade(c.maiorAtraso || 0),
        }
      })
      .sort((a, b) => b.maiorAtraso - a.maiorAtraso)
  },

  // Acordos cuja 1ª parcela vence hoje
  async getAcordosHoje() {
    const hoje = todayStr()

    const [acordos, clientes] = await Promise.all([
      acordoService.getAcordos(),
      clienteService.getClientesEnriched(),
    ])

    const clienteMap = {}
    for (const c of clientes) {
      clienteMap[c.id] = c
      if (c.codigo) clienteMap[c.codigo] = c
    }

    return acordos
      .filter((a) => a.vencimentoPrimeiraParcela === hoje)
      .map((a) => {
        const c = clienteMap[a.clienteId] || clienteMap[a.clienteCodigo] || {}
        return {
          ...a,
          clienteNome: c.razaoSocial || a.clienteCodigo,
          clienteNome2: c.nomeFantasia || '',
          filial: c.filial || '',
          grupoCliente: c.grupoCliente || '—',
          valorAberto: c.valorTotalAberto || 0,
          maiorAtraso: c.maiorAtraso || 0,
        }
      })
      .sort((a, b) => b.valorNegociado - a.valorNegociado)
  },

  // Títulos que vencem exatamente hoje
  async getTitulosVencendoHoje() {
    const titulos = await tituloService.getTitulosRaw()
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const clientes = await clienteService.getClientesEnriched()
    const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c]))

    return titulos
      .filter((t) => t.vencimento && isSameDay(t.vencimento, hoje) && t.saldoAtual > 0)
      .map((t) => ({
        ...t,
        clienteNome: clienteMap[t.clienteId]?.razaoSocial || t.clienteCodigo,
        grupoCliente: clienteMap[t.clienteId]?.grupoCliente || '—',
      }))
      .sort((a, b) => b.saldoAtual - a.saldoAtual)
  },
}
