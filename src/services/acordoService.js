import protheusApi from './protheusApi'
import { mockAcordos } from '../mocks/acordos'

// Mude para false quando os endpoints Protheus (STWS022) estiverem disponíveis
const USE_MOCK = true

const BASE_URL = '/rest/STWS022P'

let mockData = [...mockAcordos]
let nextId = mockData.length + 1

function toProtheusDate(isoStr) {
  if (!isoStr) return ''
  const match = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}${match[2]}${match[3]}` : ''
}

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

// Monta o payload no formato da tabela ZAC010
function toProtheusPayload(payload) {
  const [codcli, loja = '01'] = String(payload.clienteId || '').split('-')
  const vlneg = parseFloat(payload.valorNegociado) || 0
  const qtparc = parseInt(payload.qtdParcelas) || 1
  const vlparc = qtparc > 0 ? parseFloat((vlneg / qtparc).toFixed(2)) : 0

  return {
    ZAC_FILIAL: payload.filial || '0201',
    ZAC_NUM: payload.id || uuid(),
    ZAC_CODCLI: codcli || '',
    ZAC_LOJA: loja,
    ZAC_NOMCLI: payload.clienteNome || '',
    ZAC_USUARIO: payload.usuario || '',
    ZAC_DATA: toProtheusDate(payload.dataAcordo),
    ZAC_VALOR: vlneg,
    ZAC_QTPARC: qtparc,
    ZAC_VLPARC: vlparc,
    ZAC_DTVPRO: toProtheusDate(payload.vencimentoPrimeiraParcela),
    ZAC_STATUS: payload.status || 'em_aberto',
    ZAC_OBS: payload.observacoes || '',
  }
}

// Mapeia registro ZAC010 → formato interno do app
function fromProtheusRecord(raw) {
  const d = String(raw.ZAC_DATA || '')
  const p = String(raw.ZAC_DTVPRO || '')

  return {
    id: raw.ZAC_NUM,
    clienteId: `${String(raw.ZAC_CODCLI).trim()}-${String(raw.ZAC_LOJA).trim()}`,
    clienteCodigo: raw.ZAC_CODCLI,
    clienteNome: raw.ZAC_NOMCLI,
    usuario: raw.ZAC_USUARIO,
    dataAcordo: d.length === 8
      ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      : null,
    valorNegociado: parseFloat(raw.ZAC_VALOR) || 0,
    qtdParcelas: parseInt(raw.ZAC_QTPARC) || 0,
    valorParcela: parseFloat(raw.ZAC_VLPARC) || 0,
    vencimentoPrimeiraParcela: p.length === 8
      ? `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`
      : null,
    status: raw.ZAC_STATUS,
    observacoes: raw.ZAC_OBS,
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
    const [codcli, loja = '01'] = String(params.clienteId || '').split('-')
    const { data } = await protheusApi.get(`${BASE_URL}/listar`, {
      params: { codcli, loja, status: params.status || '' },
    })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || [])
    return lista.map(fromProtheusRecord)
  },

  // POST → ZAC010
  async createAcordo(payload) {
    if (USE_MOCK) {
      const vlneg = parseFloat(payload.valorNegociado) || 0
      const qtparc = parseInt(payload.qtdParcelas) || 1
      const novo = {
        id: nextId++,
        ...payload,
        valorParcela: parseFloat((vlneg / qtparc).toFixed(2)),
      }
      mockData = [novo, ...mockData]
      return novo
    }
    const body = toProtheusPayload(payload)
    const { data } = await protheusApi.post(`${BASE_URL}/gravar`, body)
    return fromProtheusRecord(data)
  },

  // PUT → atualiza status do acordo em ZAC010
  async updateAcordo(id, payload) {
    if (USE_MOCK) {
      mockData = mockData.map((a) => (String(a.id) === String(id) ? { ...a, ...payload } : a))
      return mockData.find((a) => String(a.id) === String(id))
    }
    const body = { ZAC_NUM: id, ZAC_STATUS: payload.status }
    const { data } = await protheusApi.post(`${BASE_URL}/atualizar`, body)
    return fromProtheusRecord(data)
  },
}
