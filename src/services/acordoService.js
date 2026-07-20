import protheusApi from './protheusApi'
import { mockAcordos } from '../mocks/acordos'

const USE_MOCK = false

const POST_URL = '/rest/STWSF05/gravar'     // gravação  (porta 8091)
const GET_URL  = '/rest/STWSF05/listar'     // consulta  (porta 8091)

let mockData = [...mockAcordos]
let nextId = mockData.length + 1

// Converte data ISO (YYYY-MM-DD) para DD/MM/YYYY (caractere)
function toProtheusDate(isoStr) {
  if (!isoStr) return ''
  const match = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

// Converte DD/MM/YYYY ou YYYYMMDD recebido da API para ISO YYYY-MM-DD
function parseProtheusDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const ymd = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`
  return null
}

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

// Monta o payload no formato esperado pela API STWSF05/gravar
function toProtheusPayload(payload) {
  const clienteIdStr = String(payload.clienteId || '')
  const dashIdx = clienteIdStr.lastIndexOf('-')
  const codcli = dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr
  const loja   = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : '01'
  const vlneg  = parseFloat(payload.valorNegociado) || 0
  const qtparc = parseInt(payload.qtdParcelas) || 1
  const vlparc = qtparc > 0 ? parseFloat((vlneg / qtparc).toFixed(2)) : 0

  return {
    cNUM:    payload.id || uuid(),
    cCODCLI: payload.clienteCodigo || codcli,
    cLOJA:   loja,
    dDATA:   toProtheusDate(payload.dataAcordo),
    nVALOR:  vlneg,
    nQTPARC: qtparc,
    nVLPARC: vlparc,
    dDTVPRO: toProtheusDate(payload.vencimentoPrimeiraParcela),
    cSTATUS: payload.status || 'em_aberto',
    cOBS:    payload.observacoes || '',
  }
}

// Mapeia retorno da API STWSF05/listar → formato interno do app
function fromProtheusRecord(raw) {
  return {
    id: raw.cNUM,
    clienteId: `${String(raw.cCODCLI || '').trim()}-${String(raw.cLOJA || '').trim()}`,
    clienteCodigo: String(raw.cCODCLI || '').trim(),
    dataAcordo: parseProtheusDate(raw.dDATA),
    valorNegociado: parseFloat(raw.nVALOR) || 0,
    qtdParcelas: parseInt(raw.nQTPARC) || 0,
    valorParcela: parseFloat(raw.nVLPARC) || 0,
    vencimentoPrimeiraParcela: parseProtheusDate(raw.dDTVPRO),
    status: raw.cSTATUS || '',
    observacoes: raw.cOBS || '',
  }
}

export const acordoService = {
  // Busca todos os acordos de todos os clientes (range 000000-999999)
  async getAcordos(params = {}) {
    if (USE_MOCK) {
      let result = [...mockData]
      if (params.clienteId) result = result.filter((a) => String(a.clienteId) === String(params.clienteId))
      if (params.status) result = result.filter((a) => a.status === params.status)
      return result
    }
    const { data } = await protheusApi.get(GET_URL, {
      params: { CodCli1: '000000', CodCli2: '999999', Loja1: '00', Loja2: '99' },
    })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || data.registros || [])
    return lista.map(fromProtheusRecord)
  },

  // Busca acordos de um cliente específico (CodCli1=CodCli2=mesmo código)
  async getAcordosCliente(clienteId) {
    if (USE_MOCK) {
      return mockData.filter((a) => String(a.clienteId) === String(clienteId))
    }
    const clienteIdStr = String(clienteId)
    const dashIdx = clienteIdStr.lastIndexOf('-')
    const codcli = dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr
    const loja   = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : '01'
    const { data } = await protheusApi.get(GET_URL, {
      params: { CodCli1: codcli, CodCli2: codcli, Loja1: loja, Loja2: loja },
    })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || data.registros || [])
    return lista.map(fromProtheusRecord)
  },

  async createAcordo(payload) {
    if (USE_MOCK) {
      const vlneg  = parseFloat(payload.valorNegociado) || 0
      const qtparc = parseInt(payload.qtdParcelas) || 1
      const novo   = { id: nextId++, ...payload, valorParcela: parseFloat((vlneg / qtparc).toFixed(2)) }
      mockData = [novo, ...mockData]
      return novo
    }
    const body = toProtheusPayload(payload)
    const { data } = await protheusApi.post(POST_URL, body)
    return data
  },

  async updateAcordo(id, payload) {
    if (USE_MOCK) {
      mockData = mockData.map((a) => (String(a.id) === String(id) ? { ...a, ...payload } : a))
      return mockData.find((a) => String(a.id) === String(id))
    }
    const body = { cNUM: id, cSTATUS: payload.status }
    const { data } = await protheusApi.put(POST_URL, body)
    return data
  },
}
