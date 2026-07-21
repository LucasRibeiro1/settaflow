import protheusApi from './protheusApi'
import { extractArray } from '../utils/apiMappers'
import { mapContrato, mapHistorico, mapTratativa, toProtheusPayload } from '../utils/contratoMappers'
import { STATUS_EM_PROCESSO } from '../utils/contratoConstants'

const LISTAR_URL = '/rest/STWSF09/listar/'
const GRAVAR_URL = '/rest/STWSF09P/gravar'
const HISTORICO_URL = '/rest/STWSF10/listar/'
const TRATATIVAS_URL = '/rest/STWSF11/listar/'

// Cache em memória: listagem, criação, histórico e tratativas já são reais
// (STWSF09, STWSF09P, STWSF10, STWSF11); as demais ações de escrita abaixo
// (alterar status, análise técnica) ainda não têm rotina no Protheus, então
// mutam esse cache localmente até os próximos endpoints chegarem.
let cache = null
let fetchPromise = null

function agrupaPorNumero(lista) {
  const porNumero = {}
  for (const item of lista) {
    if (!porNumero[item.numero]) porNumero[item.numero] = []
    porNumero[item.numero].push(item)
  }
  for (const grupo of Object.values(porNumero)) {
    grupo.sort((a, b) => (a.data < b.data ? -1 : 1))
  }
  return porNumero
}

// Uma lista auxiliar não pode derrubar a listagem inteira se falhar — o
// contrato fica só sem aquela informação, em vez de quebrar tudo.
function getOuVazio(url, nome) {
  return protheusApi.get(url).catch((err) => {
    console.error(`[Contratos] falha ao buscar ${nome} (${url}):`, err?.message || err)
    return { data: [] }
  })
}

async function ensureLoaded() {
  if (cache) return cache
  if (!fetchPromise) {
    fetchPromise = Promise.all([
      protheusApi.get(LISTAR_URL),
      getOuVazio(HISTORICO_URL, 'histórico'),
      getOuVazio(TRATATIVAS_URL, 'tratativas'),
    ])
      .then(([contratosRes, historicoRes, tratativasRes]) => {
        const historicoPorNumero = agrupaPorNumero(extractArray(historicoRes.data).map(mapHistorico))
        const tratativasPorNumero = agrupaPorNumero(extractArray(tratativasRes.data).map(mapTratativa))

        cache = extractArray(contratosRes.data).map((raw) => {
          const contrato = mapContrato(raw)
          contrato.historico = historicoPorNumero[contrato.numero] || []
          contrato.tratativas = tratativasPorNumero[contrato.numero] || []
          return contrato
        })
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
