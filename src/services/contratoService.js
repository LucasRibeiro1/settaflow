import protheusApi from './protheusApi'
import { extractArray } from '../utils/apiMappers'
import { mapContrato, toProtheusPayload } from '../utils/contratoMappers'
import { STATUS_EM_PROCESSO } from '../utils/contratoConstants'

const LISTAR_URL = '/rest/STWSF09/listar/'
const GRAVAR_URL = '/rest/STWSF09P/gravar'

// Cache em memória: listagem e criação já são reais (STWF09/STWSF09P); as
// demais ações de escrita abaixo (alterar status, análise técnica, tratativa)
// ainda não têm rotina no Protheus, então mutam esse cache localmente até os
// próximos endpoints chegarem.
let cache = null
let fetchPromise = null

async function ensureLoaded() {
  if (cache) return cache
  if (!fetchPromise) {
    fetchPromise = protheusApi
      .get(LISTAR_URL)
      .then(({ data }) => {
        cache = extractArray(data).map(mapContrato)
        fetchPromise = null
        return cache
      })
      .catch((err) => {
        fetchPromise = null
        throw err
      })
  }
  return fetchPromise
}

function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addEvento(contrato, evento, usuario) {
  return {
    ...contrato,
    historico: [...(contrato.historico || []), { data: hojeISO(), evento, usuario: usuario || 'Sistema' }],
  }
}

export const contratoService = {
  async getContratos(params = {}) {
    let result = [...(await ensureLoaded())]
    if (params.empresa) result = result.filter((c) => c.empresa === params.empresa)
    if (params.tipoContrato) result = result.filter((c) => c.tipoContrato === params.tipoContrato)
    if (params.status) result = result.filter((c) => c.status === params.status)
    return result.sort((a, b) => (a.dataSolicitacao < b.dataSolicitacao ? 1 : -1))
  },

  async getContrato(id) {
    await ensureLoaded()
    const contrato = cache.find((c) => c.id === id)
    if (!contrato) throw new Error(`Contrato '${id}' não encontrado`)
    return contrato
  },

  // Fila do jurídico: contratos com ação pendente atribuída ao usuário logado
  async getMinhaFila(username) {
    await ensureLoaded()
    return cache.filter((c) => STATUS_EM_PROCESSO.includes(c.status) && c.responsavelAtual === username)
  },

  async criarContrato(payload, solicitante) {
    const body = toProtheusPayload({
      ...payload,
      dataSolicitacao: payload.dataSolicitacao || hojeISO(),
      solicitante: payload.solicitante || solicitante || '',
    })
    const { data } = await protheusApi.post(GRAVAR_URL, body)
    // Força buscar a listagem atualizada (com o contrato recém-criado) na próxima chamada
    cache = null
    return data
  },

  // TODO: ainda sem rotina de gravação no Protheus — grava só no cache local da sessão
  async alterarStatus(id, novoStatus, usuario) {
    await ensureLoaded()
    cache = cache.map((c) => {
      if (c.id !== id) return c
      const atualizado = {
        ...c,
        status: novoStatus,
        responsavelAtual: STATUS_EM_PROCESSO.includes(novoStatus) ? c.responsavelAtual : null,
        dataAssinatura: novoStatus === 'vigente' && !c.dataAssinatura ? hojeISO() : c.dataAssinatura,
      }
      return addEvento(atualizado, `Status alterado para "${novoStatus}"`, usuario)
    })
    return cache.find((c) => c.id === id)
  },

  // TODO: ainda sem rotina de gravação no Protheus — grava só no cache local da sessão
  async enviarAnaliseTecnica(id, observacao, usuario) {
    await ensureLoaded()
    cache = cache.map((c) => {
      if (c.id !== id) return c
      const atualizado = { ...c, analiseTecnica: observacao }
      return addEvento(atualizado, 'Análise técnica enviada ao solicitante', usuario)
    })
    return cache.find((c) => c.id === id)
  },

  // TODO: ainda sem rotina de gravação no Protheus — grava só no cache local da sessão
  async adicionarTratativa(id, observacao, usuario) {
    await ensureLoaded()
    cache = cache.map((c) => {
      if (c.id !== id) return c
      const nova = { data: hojeISO(), usuario: usuario || 'Sistema', observacao }
      return { ...c, tratativas: [...(c.tratativas || []), nova] }
    })
    return cache.find((c) => c.id === id)
  },

  invalidateCache() {
    cache = null
    fetchPromise = null
  },
}
