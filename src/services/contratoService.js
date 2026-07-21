import protheusApi from './protheusApi'
import { extractArray } from '../utils/apiMappers'
import { mapContrato, mapHistorico, mapTratativa, toProtheusPayload, toProtheusDate, STATUS_REVERSE } from '../utils/contratoMappers'
import { STATUS_EM_PROCESSO } from '../utils/contratoConstants'
import { mockContratos } from '../mocks/contratos'

// Modo mock usado só pra demonstração/reunião — dados reais reativados.
const USE_MOCK = false

const LISTAR_URL = '/rest/STWSF09/listar/'
const GRAVAR_URL = '/rest/STWSF09P/gravar'
const HISTORICO_URL = '/rest/STWSF10/listar/'
const TRATATIVA_GRAVAR_URL = '/rest/STWSF10P/gravar'
const TRATATIVAS_URL = '/rest/STWSF11/listar/'
const ALTERAR_STATUS_URL = '/rest/STWSF12P/alterar'

// Cache em memória — no modo mock, seed único a partir de mockContratos;
// no modo real, populado a partir da API (listagem, histórico, tratativas).
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

async function ensureLoadedReal() {
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

function ensureLoadedMock() {
  if (!cache) cache = [...mockContratos]
  return cache
}

async function ensureLoaded() {
  return USE_MOCK ? ensureLoadedMock() : ensureLoadedReal()
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
    if (USE_MOCK) {
      await ensureLoaded()
      const quemSolicitou = payload.solicitante || solicitante || 'Usuário'
      const novo = {
        id: `CTR-${String(1000 + cache.length + 1)}`,
        numero: `${payload.empresa}-${String(1000 + cache.length + 1)}`,
        status: 'em_analise',
        responsavelAtual: 'Ana Costa',
        dataSolicitacao: hojeISO(),
        dataAssinatura: null,
        dataVencimento: null,
        analiseTecnica: '',
        historico: [{ data: hojeISO(), evento: 'Solicitação criada', usuario: quemSolicitou }],
        tratativas: [],
        ...payload,
        solicitante: quemSolicitou,
      }
      cache = [novo, ...cache]
      return novo
    }

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

  async alterarStatus(id, novoStatus, usuario) {
    if (USE_MOCK) {
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
    }

    await ensureLoaded()
    const contrato = cache.find((c) => c.id === id)
    const body = {
      cFILIAL: contrato?.filial || '',
      cNUMERO: id,
      cSTATUS: STATUS_REVERSE[novoStatus] || '',
    }
    await protheusApi.post(ALTERAR_STATUS_URL, body)
    // Força buscar os dados atualizados (status, responsavelAtual, dataAssinatura,
    // historico) na próxima chamada, já que o Protheus trata esses efeitos colaterais
    cache = null
    return contrato
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

  async adicionarTratativa(id, observacao, usuario) {
    if (USE_MOCK) {
      await ensureLoaded()
      cache = cache.map((c) => {
        if (c.id !== id) return c
        const nova = { data: hojeISO(), usuario: usuario || 'Sistema', observacao }
        return { ...c, tratativas: [...(c.tratativas || []), nova] }
      })
      return cache.find((c) => c.id === id)
    }

    await ensureLoaded()
    const contrato = cache.find((c) => c.id === id)
    const body = {
      cFILIAL: contrato?.filial || '',
      cNUMERO: id,
      cDATA: toProtheusDate(hojeISO()),
      cEVENTO: observacao,
      cUSUARIO: usuario || 'Sistema',
    }
    await protheusApi.post(TRATATIVA_GRAVAR_URL, body)
    // Força buscar a lista de tratativas atualizada (via STWSF11) na próxima chamada
    cache = null
    return contrato
  },

  invalidateCache() {
    cache = null
    fetchPromise = null
  },
}
