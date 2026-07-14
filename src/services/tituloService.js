import protheusApi from './protheusApi'
import { mockTitulosGlobal } from '../mocks/titulos'
import { extractArray, mapTitulo, isTituloValido } from '../utils/apiMappers'

const USE_MOCK = false

const TITULOS_URL = '/rest/STBUSCTIR/listaTitulosRec'

// Promise-cache: chamadas concorrentes compartilham o mesmo fetch em andamento
let _cache = null
let _cachePromise = null
let _cacheTs = 0
const CACHE_TTL = 90000

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    _cache = null
    _cachePromise = null
    _cacheTs = 0
  })
}

async function fetchRaw() {
  const now = Date.now()
  if (_cache && now - _cacheTs < CACHE_TTL) return _cache
  if (!_cachePromise) {
    _cachePromise = protheusApi
      .get(TITULOS_URL)
      .then(({ data }) => {
        const all = extractArray(data)
        // Remove duplicatas geradas pelo UNION ALL do ADVPL
        // Chave: empresa + titulo + parcela + cliente + vencimento + reprogramado + saldo
        const seen = new Set()
        _cache = all.filter((r) => {
          const key = [
            r.EMPRESA ?? r.FILIAL ?? '',
            r.TITULO  ?? r.NUMERO ?? '',
            r.PARCELA ?? '',
            r.COD_CLI ?? r.CODCLI ?? '',
            r.VENCIMENTO  ?? r.DTVENCTO  ?? '',
            r.REPROGRAMADO ?? r.DTVENCREA ?? '',
            r.SALDO   ?? '',
          ].join('|')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
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

export const tituloService = {
  // Títulos mapeados sem nomes de clientes — usado internamente (sem dependência circular)
  async getTitulosRaw() {
    if (USE_MOCK) return mockTitulosGlobal

    const raw = await fetchRaw()
    return raw.map((r) => mapTitulo(r, null)).filter(isTituloValido)
  },

  // Títulos enriquecidos com nome do cliente — para a página Consulta de Títulos
  async getTitulos(params = {}) {
    if (USE_MOCK) {
      let result = [...mockTitulosGlobal]
      if (params.clienteId) result = result.filter((t) => String(t.clienteId) === String(params.clienteId))
      if (params.tipo) result = result.filter((t) => t.tipo === params.tipo)
      if (params.atraso === 'vencido') result = result.filter((t) => t.diasAtraso > 0)
      if (params.atraso === 'no_prazo') result = result.filter((t) => t.diasAtraso === 0)
      if (params.faixa) {
        const faixas = {
          '1-30': (t) => t.diasAtraso >= 1 && t.diasAtraso <= 30,
          '31-60': (t) => t.diasAtraso >= 31 && t.diasAtraso <= 60,
          '61-90': (t) => t.diasAtraso >= 61 && t.diasAtraso <= 90,
          '91-120': (t) => t.diasAtraso >= 91 && t.diasAtraso <= 120,
          '+120': (t) => t.diasAtraso > 120,
        }
        if (faixas[params.faixa]) result = result.filter(faixas[params.faixa])
      }
      result.sort((a, b) => b.diasAtraso - a.diasAtraso)
      return { data: result, total: result.length }
    }

    // Sequencial para evitar race condition no cache: títulos primeiro, depois clientes
    const titulos = await this.getTitulosRaw()

    // Import dinâmico para evitar dependência circular no momento do carregamento do módulo
    const { clienteService } = await import('./clienteService')
    const clientes = await clienteService.getClientesEnriched()

    const clienteMap = {}
    for (const c of clientes) {
      clienteMap[c.id] = c
    }

    const result = titulos.map((t) => ({
      ...t,
      clienteNome: clienteMap[t.clienteId]?.razaoSocial || t.clienteCodigo,
      grupoCliente: clienteMap[t.clienteId]?.grupoCliente || '—',
      carteira: clienteMap[t.clienteId]?.carteira || '—',
    }))

    result.sort((a, b) => b.diasAtraso - a.diasAtraso)
    return { data: result, total: result.length }
  },

  // Mapeamento label → código numérico esperado pela API STWS019A
  INADIM_CODE: { normal: '1', externa: '2', juridico: '3' },
  MOTIVO_CODE: { setta: '1', cliente: '2' },

  // Envia alteração de inadimplência/motivo para a API STWS019A
  async alterarClassificacao(titulo, { inadimplencia, motivo }) {
    const body = {
      cTitulo:  String(titulo.titulo  || '').trim(),
      cCODCLI:  String(titulo.clienteCodigo || '').trim(),
      cLoja:    String(titulo.clienteId || '').split('-').pop() || '01',
      cPrefixo: String(titulo.prefixo || '').trim(),
      cEMPFIL:  String(titulo.filial  || '').trim(),
      cInadim:  this.INADIM_CODE[inadimplencia] ?? '',
      cMotivo:  this.MOTIVO_CODE[motivo]        ?? '',
    }
    const { data } = await protheusApi.post('/rest/STWS019A/alterar', body)
    return data
  },

  invalidateCache() {
    _cache = null
    _cachePromise = null
    _cacheTs = 0
  },
}
