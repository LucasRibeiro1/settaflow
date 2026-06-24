import protheusApi from './protheusApi'
import axios from 'axios'
import { mockAcordos } from '../mocks/acordos'

const USE_MOCK = false

const POST_URL = '/rest/STWS022P'          // gravação  (porta 8091)
const GET_URL  = '/acordos/STWS022G/listar' // consulta (porta 8089, via proxy /acordos)

let mockData = [...mockAcordos]
let nextId = mockData.length + 1

// Instância separada para a porta 8089 (acordos GET)
const acordosApi = axios.create({
  baseURL: import.meta.env.VITE_PROTHEUS_URL_ACORDOS || '',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  auth: { username: 'API', password: 's&tt@' },
})

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

// Monta o payload no formato esperado pela API STWS022P
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

// Mapeia retorno da API STWS022G → formato interno do app
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
  async getAcordos(params = {}) {
    if (USE_MOCK) {
      let result = [...mockData]
      if (params.clienteId) result = result.filter((a) => String(a.clienteId) === String(params.clienteId))
      if (params.status) result = result.filter((a) => a.status === params.status)
      return result
    }
    const clienteIdStr = String(params.clienteId || '')
    const dashIdx = clienteIdStr.lastIndexOf('-')
    const codcli = dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr
    const loja   = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : '01'
    const { data } = await acordosApi.get(GET_URL, {
      params: { CodCli: codcli, Loja: loja },
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
