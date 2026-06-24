import protheusApi from './protheusApi'
import { mockTratativas } from '../mocks/tratativas'

const USE_MOCK = false

const BASE_URL = '/rest/STWS021P'

let mockData = [...mockTratativas]
let nextId = mockData.length + 1

// Converte data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:MM...) para AAAAMMDD

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

// Monta o payload no formato da tabela ZTR010
function toProtheusPayload(payload) {
  // clienteId formato interno: 'CODCLI-LOJA' ex: '001947-01'
  const clienteIdStr = String(payload.clienteId || '')
  const dashIdx = clienteIdStr.lastIndexOf('-')
  const loja = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : '01'
  const dataHora = payload.dataHora ? new Date(payload.dataHora) : new Date()

  return {
    cNUM:    payload.id || uuid(),
    cCODCLI: payload.clienteCodigo || (dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr),
    cLOJA:   loja,
    dDATA:   dataHora.toISOString().split('T')[0],
    cTPCONT: payload.tipoContato || '',
    cSTATUS: payload.status || '',
    cOBS:    payload.observacao || '',
    cPROXAC: payload.proximaAcao || '',
    dDTPROX: payload.dataProximaAcao || '',
    cANEXOS: payload.anexos?.length ? JSON.stringify(payload.anexos) : '',
  }
}

// Mapeia registro ZTR010 → formato interno do app
function fromProtheusRecord(raw) {
  const d = String(raw.ZTR_DATA || '')
  const h = String(raw.ZTR_HORA || '00:00:00')
  const p = String(raw.ZTR_DTPROX || '')

  return {
    id: raw.ZTR_ID,
    clienteId: `${String(raw.ZTR_CODCLI).trim()}-${String(raw.ZTR_LOJA).trim()}`,
    clienteCodigo: raw.ZTR_CODCLI,
    clienteNome: raw.ZTR_NOMCLI,
    usuario: raw.ZTR_USUARIO,
    dataHora: d.length === 8
      ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${h}`
      : null,
    tipoContato: raw.ZTR_TPCONT,
    status: raw.ZTR_STATUS,
    observacao: raw.ZTR_OBS,
    proximaAcao: raw.ZTR_PROXAC,
    dataProximaAcao: p.length === 8
      ? `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`
      : '',
    anexos: (() => {
      try { return raw.ZTR_ANEXOS ? JSON.parse(raw.ZTR_ANEXOS) : [] }
      catch { return [] }
    })(),
  }
}

export const tratativaService = {
  async getTratativas(params = {}) {
    if (USE_MOCK) {
      let result = [...mockData]
      if (params.clienteId) result = result.filter((t) => String(t.clienteId) === String(params.clienteId))
      if (params.usuario) result = result.filter((t) => t.usuario === params.usuario)
      if (params.status) result = result.filter((t) => t.status === params.status)
      result.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
      return result
    }
    const { data } = await protheusApi.get(`${BASE_URL}/listar`, { params })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || [])
    return lista.map(fromProtheusRecord)
  },

  async getTratativasCliente(clienteId) {
    if (USE_MOCK) {
      return mockData
        .filter((t) => String(t.clienteId) === String(clienteId))
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
    }
    const [codcli, loja = '01'] = String(clienteId).split('-')
    const { data } = await protheusApi.get(BASE_URL, { params: { codcli, loja } })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || data.registros || [])
    return lista
      .map(fromProtheusRecord)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
  },

  // POST → ZTR010
  async createTratativa(payload) {
    if (USE_MOCK) {
      const nova = { id: nextId++, ...payload }
      mockData = [nova, ...mockData]
      return nova
    }
    const body = toProtheusPayload(payload)
    const { data } = await protheusApi.post(BASE_URL, body)
    return data
  },

  async updateTratativa(id, payload) {
    if (USE_MOCK) {
      mockData = mockData.map((t) => (t.id === id || t.id === Number(id) ? { ...t, ...payload } : t))
      return mockData.find((t) => t.id === id || t.id === Number(id))
    }
    const { data } = await protheusApi.put(BASE_URL, { ZTR_ID: id, ...payload })
    return data
  },

  async deleteTratativa(id) {
    if (USE_MOCK) {
      mockData = mockData.filter((t) => t.id !== id && t.id !== Number(id))
      return { success: true }
    }
    await protheusApi.delete(BASE_URL, { data: { ZTR_ID: id } })
    return { success: true }
  },
}
