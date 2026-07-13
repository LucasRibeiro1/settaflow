import { mockContratos } from '../mocks/contratos'
import { STATUS_EM_PROCESSO } from '../utils/contratoConstants'

// Ainda não existe rotina no Protheus para contratos jurídicos — módulo
// roda 100% sobre dados simulados até o back-end real ficar disponível.
const USE_MOCK = true

let mockData = [...mockContratos]
let nextSeq = mockData.length + 1

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
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    let result = [...mockData]
    if (params.empresa) result = result.filter((c) => c.empresa === params.empresa)
    if (params.tipoContrato) result = result.filter((c) => c.tipoContrato === params.tipoContrato)
    if (params.status) result = result.filter((c) => c.status === params.status)
    return result.sort((a, b) => (a.dataSolicitacao < b.dataSolicitacao ? 1 : -1))
  },

  async getContrato(id) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    const contrato = mockData.find((c) => c.id === id)
    if (!contrato) throw new Error(`Contrato '${id}' não encontrado`)
    return contrato
  },

  // Fila do jurídico: contratos com ação pendente atribuída ao usuário logado
  async getMinhaFila(username) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    return mockData.filter((c) => STATUS_EM_PROCESSO.includes(c.status) && c.responsavelAtual === username)
  },

  async criarContrato(payload, solicitante) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    const seq = nextSeq++
    const novo = {
      id: `CTR-${String(1000 + mockData.length + seq)}`,
      numero: `${payload.empresa}-${String(1000 + mockData.length + seq)}`,
      status: 'em_analise',
      responsavelAtual: 'Ana Costa',
      dataSolicitacao: hojeISO(),
      solicitante: solicitante || 'Usuário',
      dataAssinatura: null,
      dataVencimento: null,
      analiseTecnica: '',
      historico: [{ data: hojeISO(), evento: 'Solicitação criada', usuario: solicitante || 'Usuário' }],
      tratativas: [],
      ...payload,
    }
    mockData = [novo, ...mockData]
    return novo
  },

  async alterarStatus(id, novoStatus, usuario) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    mockData = mockData.map((c) => {
      if (c.id !== id) return c
      const atualizado = {
        ...c,
        status: novoStatus,
        responsavelAtual: STATUS_EM_PROCESSO.includes(novoStatus) ? c.responsavelAtual : null,
        dataAssinatura: novoStatus === 'vigente' && !c.dataAssinatura ? hojeISO() : c.dataAssinatura,
      }
      return addEvento(atualizado, `Status alterado para "${novoStatus}"`, usuario)
    })
    return mockData.find((c) => c.id === id)
  },

  async enviarAnaliseTecnica(id, observacao, usuario) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    mockData = mockData.map((c) => {
      if (c.id !== id) return c
      const atualizado = { ...c, analiseTecnica: observacao }
      return addEvento(atualizado, 'Análise técnica enviada ao solicitante', usuario)
    })
    return mockData.find((c) => c.id === id)
  },

  // Registra uma tratativa/observação no histórico do contrato
  async adicionarTratativa(id, observacao, usuario) {
    if (!USE_MOCK) throw new Error('API de contratos ainda não disponível')
    mockData = mockData.map((c) => {
      if (c.id !== id) return c
      const nova = { data: hojeISO(), usuario: usuario || 'Sistema', observacao }
      return { ...c, tratativas: [...(c.tratativas || []), nova] }
    })
    return mockData.find((c) => c.id === id)
  },
}
