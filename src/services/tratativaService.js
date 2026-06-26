import protheusApi from './protheusApi'
import { clienteService } from './clienteService'
import { mockTratativas } from '../mocks/tratativas'

const USE_MOCK = false

const POST_URL = '/rest/STWS021P'         // gravação
const GET_URL  = '/rest/STWS021G/listar'  // consulta

let mockData = [...mockTratativas]
let nextId = mockData.length + 1

// Converte data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:MM...) para DD/MM/YYYY (caractere)
function toProtheusDate(isoStr) {
  if (!isoStr) return ''
  const match = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

// Converte DD/MM/YYYY ou YYYYMMDD recebido da API para ISO YYYY-MM-DD
function parseProtheusDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  // YYYYMMDD
  const ymd = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`
  return null
}

// Converte HHMMSS ou HH:MM:SS para HH:MM
function parseProtheusTime(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  const hms = s.match(/^(\d{2}):(\d{2})/)
  if (hms) return `${hms[1]}:${hms[2]}`
  const compact = s.match(/^(\d{2})(\d{2})/)
  if (compact) return `${compact[1]}:${compact[2]}`
  return null
}

// Monta o payload no formato esperado pela API STWS021P
function toProtheusPayload(payload) {
  const clienteIdStr = String(payload.clienteId || '')
  const dashIdx = clienteIdStr.lastIndexOf('-')
  const loja = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : ''
  const dataHora = payload.dataHora ? new Date(payload.dataHora) : new Date()

  return {
    cFILIAL: payload.filial || '',
    cNUM:    payload.id || '',   // vazio → backend gera sequencial numérico
    cCODCLI: payload.clienteCodigo || (dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr),
    cLOJA:   loja,
    dDATA:   toProtheusDate(dataHora.toISOString()),
    cTPCONT: payload.tipoContato || '',
    cSTATUS: payload.status || '',
    cOBSCON: payload.observacao || '',
    cPROXAC: payload.proximaAcao || '',
    dDTPROX: toProtheusDate(payload.dataProximaAcao),
    cANEXOS: payload.anexos?.length ? JSON.stringify(payload.anexos) : '',
    cUSUARIO: payload.usuario || '',
    cNOMCON:  payload.nomeContato || '',
    cHORA:    payload.hora || '',
  }
}

// Mapeia retorno da API STWS021G → formato interno do app
function fromProtheusRecord(raw) {
  const dataIso   = parseProtheusDate(raw.DATA)
  const horaIso   = parseProtheusTime(raw.HORA)
  const dtproxIso = parseProtheusDate(raw.DTPROX)

  return {
    id: raw.Num,
    clienteId: `${String(raw.CODCLI || '').trim()}-${String(raw.LOJA || '').trim()}`,
    clienteCodigo: String(raw.CODCLI || '').trim(),
    usuario: String(raw.USUARIO || '').trim(),
    nomeContato: String(raw.NOMCON || '').trim(),
    hora: horaIso || '',
    dataHora: dataIso ? `${dataIso}T${horaIso || '00:00'}` : null,
    tipoContato: raw.TPCONT || '',
    status: raw.STATUS || '',
    observacao: raw.OBS || '',
    proximaAcao: raw.PROXAC || '',
    dataProximaAcao: dtproxIso || '',
    anexos: (() => {
      try { return raw.ANEXOS ? JSON.parse(raw.ANEXOS) : [] }
      catch { return [] }
    })(),
  }
}

export const tratativaService = {
  // Busca todas as tratativas de todos os clientes (range 000000-999999)
  async getTratativas(params = {}) {
    if (USE_MOCK) {
      let result = [...mockData]
      if (params.clienteId) result = result.filter((t) => String(t.clienteId) === String(params.clienteId))
      if (params.usuario) result = result.filter((t) => t.usuario === params.usuario)
      if (params.status) result = result.filter((t) => t.status === params.status)
      result.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
      return result
    }
    const [{ data }, clientes] = await Promise.all([
      protheusApi.get(GET_URL, { params: { CodCli1: '000000', CodCli2: '999999', Loja1: '00', Loja2: '99' } }),
      clienteService.getClientesEnriched().catch(() => []),
    ])
    const clienteMap = {}
    for (const c of clientes) {
      clienteMap[c.id] = c.razaoSocial
      if (c.codigo) clienteMap[c.codigo] = c.razaoSocial
    }
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || data.registros || [])
    return lista.map((raw) => {
      const t = fromProtheusRecord(raw)
      t.clienteNome = clienteMap[t.clienteId] || clienteMap[t.clienteCodigo] || t.clienteCodigo
      return t
    })
  },

  // Busca tratativas de um cliente específico (CodCli1=CodCli2=mesmo código)
  async getTratativasCliente(clienteId) {
    if (USE_MOCK) {
      return mockData
        .filter((t) => String(t.clienteId) === String(clienteId))
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
    }
    const clienteIdStr = String(clienteId)
    const dashIdx = clienteIdStr.lastIndexOf('-')
    const codcli = dashIdx > 0 ? clienteIdStr.slice(0, dashIdx) : clienteIdStr
    const loja   = dashIdx > 0 ? clienteIdStr.slice(dashIdx + 1) : '01'
    const { data } = await protheusApi.get(GET_URL, {
      params: { CodCli1: codcli, CodCli2: codcli, Loja1: loja, Loja2: loja },
    })
    const lista = Array.isArray(data) ? data : (data.dados || data.resultado || data.registros || [])
    return lista
      .map(fromProtheusRecord)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
  },

  async createTratativa(payload) {
    if (USE_MOCK) {
      const nova = { id: nextId++, ...payload }
      mockData = [nova, ...mockData]
      return nova
    }
    const body = toProtheusPayload(payload)
    const { data } = await protheusApi.post(POST_URL, body)
    return data
  },

  async updateTratativa(id, payload) {
    if (USE_MOCK) {
      mockData = mockData.map((t) => (t.id === id || t.id === Number(id) ? { ...t, ...payload } : t))
      return mockData.find((t) => t.id === id || t.id === Number(id))
    }
    const { data } = await protheusApi.put(POST_URL, { cNUM: id, ...payload })
    return data
  },

  async deleteTratativa(id) {
    if (USE_MOCK) {
      mockData = mockData.filter((t) => t.id !== id && t.id !== Number(id))
      return { success: true }
    }
    await protheusApi.delete(POST_URL, { data: { cNUM: id } })
    return { success: true }
  },
}
