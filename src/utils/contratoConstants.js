export const EMPRESA_OPTIONS = [
  { value: 'SEN', label: 'SEN - Setta Energy' },
  { value: 'SEE', label: 'SEE - Setta Engenharia' },
  { value: 'SDL', label: 'SDL - Setta Digital Labs' },
]
export const EMPRESA_LABELS = Object.fromEntries(EMPRESA_OPTIONS.map((o) => [o.value, o.label]))

export const TIPO_CONTRATO_OPTIONS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'locacao', label: 'Locação' },
]
export const TIPO_CONTRATO_LABELS = Object.fromEntries(TIPO_CONTRATO_OPTIONS.map((o) => [o.value, o.label]))

const ESPECIE_OPTIONS_PADRAO = [
  { value: 'fornecimento_equipamento', label: 'Fornecimento de Equipamento' },
  { value: 'fornecimento_servicos', label: 'Fornecimento de Serviços' },
  { value: 'fornecimento_servicos_equipamentos', label: 'Fornecimento de Serviços e Equipamentos' },
  { value: 'aquisicao_produtos', label: 'Aquisição de Produtos' },
  { value: 'aquisicao_servicos_equipamentos', label: 'Aquisição de Serviços e Equipamentos' },
  { value: 'aquisicao_servicos', label: 'Aquisição de Serviços' },
  { value: 'nda', label: 'NDA' },
]
const ESPECIE_OPTIONS_SDL = [
  { value: 'saas', label: 'Contrato de SaaS' },
]
export const ESPECIE_LABELS = Object.fromEntries(
  [...ESPECIE_OPTIONS_PADRAO, ...ESPECIE_OPTIONS_SDL].map((o) => [o.value, o.label])
)
export function getEspecieOptions(empresa) {
  return empresa === 'SDL' ? ESPECIE_OPTIONS_SDL : ESPECIE_OPTIONS_PADRAO
}

export const NDA_INFO_OPTIONS = [
  { value: 'contabeis_financeiras', label: 'Informações Contábeis e Financeiras' },
  { value: 'tecnicas', label: 'Informações Técnicas' },
]
export const NDA_INFO_LABELS = Object.fromEntries(NDA_INFO_OPTIONS.map((o) => [o.value, o.label]))

export const MODALIDADE_OPTIONS = [
  { value: 'inicial', label: 'Contrato Inicial' },
  { value: 'aditivo', label: 'Termo Aditivo' },
]
export const MODALIDADE_LABELS = Object.fromEntries(MODALIDADE_OPTIONS.map((o) => [o.value, o.label]))

export const SEGURO_GARANTIA_OPTIONS = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

export const TIPO_SEGURO_OPTIONS = [
  { value: 'adiantamento', label: 'Adiantamento' },
  { value: 'performance', label: 'Performance/Fiel Cumprimento/Execução' },
  { value: 'eo', label: 'E&O (Erros e Omissões)' },
  { value: 'manutencao_corretiva', label: 'Manutenção Corretiva (Warranty Bond)' },
  { value: 'locaticio_caucao', label: 'Seguro Locatícia ou Caução (Locação)' },
  { value: 'responsabilidade_civil', label: 'Responsabilidade Civil' },
  { value: 'rcp', label: 'RCP (Responsabilidade Civil Profissional)' },
]
export const TIPO_SEGURO_LABELS = Object.fromEntries(TIPO_SEGURO_OPTIONS.map((o) => [o.value, o.label]))

export const MINUTAGEM_OPTIONS = [
  { value: 'padrao_setta', label: 'Padrão Setta' },
  { value: 'padrao_cliente', label: 'Padrão Cliente (anexo do contrato)' },
]
export const MINUTAGEM_LABELS = Object.fromEntries(MINUTAGEM_OPTIONS.map((o) => [o.value, o.label]))

export const ASSINANTE_OPTIONS = [
  { value: 'responsavel_legal', label: 'Responsável Legal' },
  { value: 'procurador', label: 'Procurador' },
]
export const ASSINANTE_LABELS = Object.fromEntries(ASSINANTE_OPTIONS.map((o) => [o.value, o.label]))

// Fluxo linear do contrato — "reprovado" é um status terminal à parte,
// alcançável a partir de qualquer etapa de análise/aprovação.
export const CONTRATO_STATUS_OPTIONS = [
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'analise_tecnica', label: 'Análise Técnica' },
  { value: 'aprovacao', label: 'Aprovação' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'reprovado', label: 'Reprovado' },
]
export const CONTRATO_STATUS_LABELS = Object.fromEntries(CONTRATO_STATUS_OPTIONS.map((o) => [o.value, o.label]))

export const CONTRATO_STATUS_COLORS = {
  em_analise: 'info',
  analise_tecnica: 'purple',
  aprovacao: 'warning',
  assinatura: 'warning',
  vigente: 'success',
  vencido: 'danger',
  encerrado: 'default',
  reprovado: 'danger',
}

// Status que ainda estão "em processo" (não vigentes nem finalizados)
export const STATUS_EM_PROCESSO = ['em_analise', 'analise_tecnica', 'aprovacao', 'assinatura']
