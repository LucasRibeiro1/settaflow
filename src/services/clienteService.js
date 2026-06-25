import protheusApi from './protheusApi'
import { mockClientes, mockClienteDetalhe } from '../mocks/clientes'
import { extractArray, mapCliente, enrichClientesWithTitulos } from '../utils/apiMappers'
import { tituloService } from './tituloService'

const USE_MOCK = false

const CLIENTES_URL = '/rest/STBUSCCLI/listacliente'

// Promise-cache: chamadas concorrentes compartilham o mesmo fetch em andamento
let _cache = null
let _cachePromise = null
let _cacheTs = 0
const CACHE_TTL = 90000

// Em desenvolvimento, invalida o cache quando o módulo é recarregado pelo HMR
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    _cache = null
    _cachePromise = null
    _cacheTs = 0
  })
}

async function fetchAllEnriched() {
  const now = Date.now()
  if (_cache && now - _cacheTs < CACHE_TTL) return _cache
  if (!_cachePromise) {
    const fetchFilial = (filial) =>
      protheusApi
        .get(CLIENTES_URL, { params: { empresa: '01', filial } })
        .then(({ data }) => extractArray(data).map(mapCliente))

    _cachePromise = Promise.all([
      fetchFilial('0201'),
      fetchFilial('0301'),
      tituloService.getTitulosRaw(),
    ])
      .then(([clientes0201, clientes0301, titulos]) => {
        // Mescla clientes de todas as filiais, priorizando a primeira ocorrência
        const seen = new Set()
        const clientesRaw = [...clientes0201, ...clientes0301].filter((c) => {
          if (seen.has(c.id)) return false
          seen.add(c.id)
          return true
        })
        _cache = enrichClientesWithTitulos(clientesRaw, titulos)
        _cacheTs = Date.now()
        _cachePromise = null
        return _cache
      })
      .catch((err) => {
        _cachePromise = null
        throw err
      })
  }
  return _cachePromise
}

export const clienteService = {
  // Retorna todos os clientes enriquecidos — usado internamente pelo tituloService
  async getClientesEnriched() {
    if (USE_MOCK) return mockClientes
    return fetchAllEnriched()
  },

  async getClientesInadimplentes(params = {}) {
    if (USE_MOCK) {
      let result = [...mockClientes]
      if (params.search) {
        const q = params.search.toLowerCase()
        result = result.filter(
          (c) =>
            c.razaoSocial.toLowerCase().includes(q) ||
            c.nomeFantasia.toLowerCase().includes(q) ||
            c.codigo.toLowerCase().includes(q)
        )
      }
      if (params.status) result = result.filter((c) => c.statusCobranca === params.status)
      if (params.responsavel) result = result.filter((c) => c.responsavelCobranca === params.responsavel)
      if (params.regiao) result = result.filter((c) => c.regiao === params.regiao)
      return { data: result, total: result.length }
    }

    const todos = await fetchAllEnriched()
    // Carteira de inadimplentes: apenas clientes com título vencido em aberto
    let result = todos.filter((c) => c.qtdTitulosVencidos > 0)

    if (params.search) {
      const q = params.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.razaoSocial.toLowerCase().includes(q) ||
          c.nomeFantasia.toLowerCase().includes(q)
      )
    }
    if (params.codigo) result = result.filter((c) => c.codigo.includes(params.codigo))
    if (params.status) result = result.filter((c) => c.statusCobranca === params.status)
    if (params.responsavel) result = result.filter((c) => c.responsavelCobranca === params.responsavel)
    if (params.regiao) result = result.filter((c) => c.regiao === params.regiao)
    if (params.grupo) result = result.filter((c) => c.grupoCliente === params.grupo)

    return { data: result, total: result.length }
  },

  async getClienteById(id) {
    if (USE_MOCK) {
      return (
        mockClientes.find((c) => c.id === Number(id)) ||
        mockClientes.find((c) => c.id === id || c.codigo === id) ||
        mockClienteDetalhe
      )
    }

    const todos = await fetchAllEnriched()
    const cliente = todos.find((c) => c.id === id || c.codigo === id)
    if (!cliente) throw new Error(`Cliente '${id}' não encontrado`)
    return cliente
  },

  async getTitulosCliente(id) {
    if (USE_MOCK) return mockClienteDetalhe.titulos

    const titulos = await tituloService.getTitulosRaw()
    const [codigo] = String(id).split('-')
    return titulos.filter((t) => t.clienteId === id || t.clienteCodigo === codigo)
  },

  async alterarObservacao(clienteId, observacao) {
    const [cCODCLI, cLoja] = String(clienteId).split('-')
    const { data } = await protheusApi.post('/rest/STWS019A1/alterarobs', {
      cCODCLI,
      cLoja: cLoja || '01',
      cObserv: String(observacao || ''),
    })
    return data
  },

  invalidateCache() {
    _cache = null
    _cachePromise = null
    _cacheTs = 0
    tituloService.invalidateCache()
  },
}
