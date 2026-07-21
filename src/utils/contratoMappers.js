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

// Converte o retorno de /STWF09/listar/ pro formato interno usado no front
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
