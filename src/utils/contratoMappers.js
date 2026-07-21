import { parseProtheusDate } from './apiMappers'

const TIPO_MAP = { 1: 'cliente', 2: 'fornecedor', 3: 'locacao' }

const ESPECIE_MAP = {
  1: 'fornecimento_equipamento',
  2: 'fornecimento_servicos',
  3: 'fornecimento_servicos_equipamentos',
  4: 'aquisicao_produtos',
  5: 'aquisicao_servicos_equipamentos',
  6: 'aquisicao_servicos',
  7: 'nda',
  8: 'saas',
}

const MODALIDADE_MAP = { 1: 'inicial', 2: 'aditivo' }

const TIPO_SEGURO_MAP = {
  1: 'adiantamento',
  2: 'performance',
  3: 'eo',
  4: 'manutencao_corretiva',
  5: 'locaticio_caucao',
  6: 'responsabilidade_civil',
  7: 'rcp',
}

const MINUTAGEM_MAP = { 1: 'padrao_setta', 2: 'padrao_cliente' }
const ASSINANTE_MAP = { 1: 'responsavel_legal', 2: 'procurador' }

const STATUS_MAP = {
  1: 'em_analise',
  2: 'analise_tecnica',
  3: 'aprovacao',
  4: 'assinatura',
  5: 'vigente',
  6: 'vencido',
  7: 'encerrado',
  8: 'reprovado',
}

function toBool(v) {
  return v === true || v === 'true' || v === 'S' || v === 's' || v === 1 || v === '1'
}

function invert(map) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))
}

const TIPO_REVERSE = invert(TIPO_MAP)
const ESPECIE_REVERSE = invert(ESPECIE_MAP)
const MODALIDADE_REVERSE = invert(MODALIDADE_MAP)
const TIPO_SEGURO_REVERSE = invert(TIPO_SEGURO_MAP)
const MINUTAGEM_REVERSE = invert(MINUTAGEM_MAP)
const ASSINANTE_REVERSE = invert(ASSINANTE_MAP)

// Converte "YYYY-MM-DD" -> "YYYYMMDD"
function toProtheusDate(isoStr) {
  if (!isoStr) return ''
  const match = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}${match[2]}${match[3]}` : ''
}

// Converte Date -> "YYYY-MM-DD" (o app trabalha com data em string ISO, não Date)
function isoDate(d) {
  if (!d) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function codigo(v) {
  if (v == null || v === '') return null
  const n = parseInt(String(v).trim(), 10)
  return Number.isNaN(n) ? null : n
}

// Converte o retorno de /STWSF09/listar/ pro formato interno usado no front
export function mapContrato(raw) {
  const numero = String(raw.NUMERO ?? '').trim()
  const seguro = toBool(raw.SEGGAR)
  const ndaInfo = []
  if (toBool(raw.NDAINFO)) ndaInfo.push('contabeis_financeiras')
  if (toBool(raw.NDATEC)) ndaInfo.push('tecnicas')

  return {
    id: numero,
    numero,
    filial: String(raw.FILIAL ?? '').trim(),
    empresa: String(raw.EMPRESA ?? '').trim(),
    tipoContrato: TIPO_MAP[codigo(raw.TIPO)] || '',
    anexoLocacao: String(raw.ANEXOLOC ?? '').trim() || null,
    especie: ESPECIE_MAP[codigo(raw.ESPECIE)] || '',
    ndaInfo,
    modalidade: MODALIDADE_MAP[codigo(raw.MODALIDADE)] || '',
    contratoOriginal: String(raw.CTRORI ?? '').trim() || null,
    seguroGarantia: seguro ? 'sim' : 'nao',
    tipoSeguro: seguro ? (TIPO_SEGURO_MAP[codigo(raw.TPSEG)] || null) : null,
    minutagem: MINUTAGEM_MAP[codigo(raw.MINUTA)] || '',
    anexoMinuta: String(raw.ANEXOMINUTA ?? '').trim() || null,
    clienteCodigo: String(raw.CODCLI ?? '').trim(),
    loja: String(raw.LOJA ?? '').trim(),
    clienteNome: String(raw.NOMCLI ?? '').trim(),
    clienteCnpj: String(raw.CGCCLI ?? '').trim(),
    clienteEmail: String(raw.EMACLI ?? '').trim(),
    assinante: ASSINANTE_MAP[codigo(raw.ASSINA)] || '',
    anexoProcuracao: String(raw.ANEXOPROC ?? '').trim() || null,
    anexoPropostaComercial: String(raw.ANEXOPROP ?? '').trim() || null,
    observacoes: String(raw.OBSERV ?? '').trim(),
    dataSolicitacao: isoDate(parseProtheusDate(raw.DTSOLI)),
    solicitante: String(raw.SOLICI ?? '').trim(),
    status: STATUS_MAP[codigo(raw.STATUS)] || 'em_analise',
    responsavelAtual: String(raw.RESPAT ?? '').trim() || null,
    dataAssinatura: isoDate(parseProtheusDate(raw.DTASSI)),
    dataVencimento: isoDate(parseProtheusDate(raw.DTVENC)),
    analiseTecnica: String(raw.ANEXOTEC ?? '').trim(),
    historico: [],
    tratativas: [],
  }
}

// Converte o retorno de /STWSF10/listar/ (histórico de eventos) pro formato interno
export function mapHistorico(raw) {
  return {
    numero: String(raw.NUMERO ?? '').trim(),
    filial: String(raw.FILIAL ?? '').trim(),
    data: isoDate(parseProtheusDate(raw.DATA)),
    evento: String(raw.EVENTO ?? '').trim(),
    usuario: String(raw.USUARIO ?? '').trim(),
  }
}

// Converte o retorno de /STWSF11/listar/ (tratativas/observações) pro formato interno
// Mesma estrutura do histórico, mas o campo EVENTO carrega o texto da tratativa.
export function mapTratativa(raw) {
  return {
    numero: String(raw.NUMERO ?? '').trim(),
    filial: String(raw.FILIAL ?? '').trim(),
    data: isoDate(parseProtheusDate(raw.DATA)),
    usuario: String(raw.USUARIO ?? '').trim(),
    observacao: String(raw.EVENTO ?? '').trim(),
  }
}

// Monta o payload pro POST /rest/STWSF09P/gravar a partir do formato interno
export function toProtheusPayload(payload) {
  const seguro = payload.seguroGarantia === 'sim'

  return {
    cFILIAL: payload.filial || '',
    cNUMERO: payload.numero || '',
    cEMPRES: payload.empresa || '',
    cTIPCTR: TIPO_REVERSE[payload.tipoContrato] || '',
    cANLOC: payload.anexoLocacao || '',
    cESPECI: ESPECIE_REVERSE[payload.especie] || '',
    cNDACF: payload.ndaInfo?.includes('contabeis_financeiras') ? 'S' : 'N',
    cNDATEC: payload.ndaInfo?.includes('tecnicas') ? 'S' : 'N',
    cMODCTR: MODALIDADE_REVERSE[payload.modalidade] || '',
    cCTRORI: payload.contratoOriginal || '',
    cSEGGAR: seguro ? 'S' : 'N',
    cTPSEG: seguro ? (TIPO_SEGURO_REVERSE[payload.tipoSeguro] || '') : '',
    cMINUTA: MINUTAGEM_REVERSE[payload.minutagem] || '',
    cANMIN: payload.anexoMinuta || '',
    cCODCLI: payload.clienteCodigo || '',
    cLOJA: payload.loja || '',
    cNOMCLI: payload.clienteNome || '',
    cCGCCLI: payload.clienteCnpj || '',
    cEMACLI: payload.clienteEmail || '',
    cASSINA: ASSINANTE_REVERSE[payload.assinante] || '',
    cANPROC: payload.anexoProcuracao || '',
    cANCOM: payload.anexoPropostaComercial || '',
    cOBSERV: payload.observacoes || '',
    cDTSOLI: toProtheusDate(payload.dataSolicitacao),
    cSOLICI: payload.solicitante || '',
    cSTATUS: '1',
    cRESPAT: '',
    cDTASSI: '',
    cDTVENC: '',
    cANATEC: '',
  }
}
