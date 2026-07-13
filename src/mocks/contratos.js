// Dados simulados do módulo Jurídico — Contratos.
// Estrutura alinhada ao pedido: cada registro representa um contrato em algum
// ponto do fluxo (Em Análise → Análise Técnica → Aprovação → Assinatura → Vigente
// → Vencido/Encerrado), com Reprovado como status terminal à parte.

const ANALISTAS = ['Ana Costa', 'Bruno Lima', 'Carla Souza', 'lucas.ribeiro']
const SOLICITANTES = ['Marcos Prado', 'Juliana Reis', 'Rafael Nunes', 'Fernanda Alves', 'Pedro Martins']

const EMPRESAS = ['SEN', 'SEE', 'SEE', 'SEN', 'SDL']

const ESPECIES_PADRAO = [
  'fornecimento_equipamento',
  'fornecimento_servicos',
  'fornecimento_servicos_equipamentos',
  'aquisicao_produtos',
  'aquisicao_servicos_equipamentos',
  'aquisicao_servicos',
  'nda',
]

const CLIENTES_FORNECEDORES = [
  { nome: 'Araxá Engenharia S.A.', cnpj: '12345678000190', email: 'contato@araxaengenharia.com.br' },
  { nome: 'Tomio Fukuda e Outro(s)', cnpj: '98765432000155', email: 'financeiro@fukuda.com.br' },
  { nome: 'Grupo Origo Energia', cnpj: '11222333000144', email: 'juridico@origoenergia.com.br' },
  { nome: 'WEG Drives e Controles Ltda', cnpj: '84429695000180', email: 'contratos@weg.net' },
  { nome: 'Louis Dreyfus Company', cnpj: '60398138000190', email: 'legal@ldc.com' },
  { nome: 'Monsanto do Brasil Ltda', cnpj: '59104422000174', email: 'suprimentos@monsanto.com.br' },
  { nome: 'Casa da Automação Ltda', cnpj: '22333444000155', email: 'comercial@casaautomacao.com.br' },
  { nome: 'Naves Engenharia Ltda', cnpj: '33444555000166', email: 'contratos@navesengenharia.com.br' },
  { nome: 'Edson Michael Consultoria', cnpj: '44555666000177', email: 'edson@emconsultoria.com.br' },
  { nome: 'Sonnenschein Brasil Ltda', cnpj: '55666777000188', email: 'legal@sonnenschein.com.br' },
]

const STATUS_CICLO = [
  'em_analise', 'analise_tecnica', 'aprovacao', 'assinatura',
  'vigente', 'vigente', 'vigente', 'vencido', 'encerrado', 'reprovado',
]

function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const HOJE = '2026-07-10'

function buildContrato(i) {
  const empresa = EMPRESAS[i % EMPRESAS.length]
  const tipoContrato = ['cliente', 'fornecedor', 'locacao'][i % 3]
  const especie = empresa === 'SDL' ? 'saas' : ESPECIES_PADRAO[i % ESPECIES_PADRAO.length]
  const modalidade = i % 5 === 0 ? 'aditivo' : 'inicial'
  const seguroGarantia = i % 3 === 0 ? 'sim' : 'nao'
  const tipoSeguro = seguroGarantia === 'sim'
    ? ['adiantamento', 'performance', 'eo', 'manutencao_corretiva', 'locaticio_caucao', 'responsabilidade_civil', 'rcp'][i % 7]
    : null
  const minutagem = i % 4 === 0 ? 'padrao_cliente' : 'padrao_setta'
  const assinante = i % 6 === 0 ? 'procurador' : 'responsavel_legal'
  const status = STATUS_CICLO[i % STATUS_CICLO.length]
  const parte = CLIENTES_FORNECEDORES[i % CLIENTES_FORNECEDORES.length]
  const emProcesso = ['em_analise', 'analise_tecnica', 'aprovacao', 'assinatura'].includes(status)
  const dataSolicitacao = addDays(HOJE, -(90 - (i * 3) % 90))
  const dataAssinatura = status === 'vigente' || status === 'vencido' || status === 'encerrado'
    ? addDays(dataSolicitacao, 15)
    : null
  const dataVencimento = dataAssinatura ? addDays(dataAssinatura, 365 - (i % 5) * 90) : null

  return {
    id: `CTR-${String(1000 + i)}`,
    numero: `${empresa}-${String(1000 + i)}`,
    empresa,
    tipoContrato,
    anexoLocacao: tipoContrato === 'locacao' ? `locacao_${1000 + i}.pdf` : null,
    especie,
    ndaInfo: especie === 'nda' ? (i % 2 === 0 ? ['contabeis_financeiras'] : ['contabeis_financeiras', 'tecnicas']) : [],
    modalidade,
    contratoOriginal: modalidade === 'aditivo' ? `${empresa}-${String(1000 + i - 5)}` : null,
    seguroGarantia,
    tipoSeguro,
    minutagem,
    anexoMinuta: minutagem === 'padrao_cliente' ? `minuta_cliente_${1000 + i}.pdf` : null,
    clienteNome: parte.nome,
    clienteCnpj: parte.cnpj,
    clienteEmail: parte.email,
    assinante,
    anexoProcuracao: assinante === 'procurador' ? `procuracao_${1000 + i}.pdf` : null,
    anexoPropostaComercial: `proposta_comercial_${1000 + i}.pdf`,
    observacoes: i % 4 === 0 ? 'Cliente solicitou revisão de cláusula de reajuste anual.' : '',
    dataSolicitacao,
    solicitante: SOLICITANTES[i % SOLICITANTES.length],
    status,
    responsavelAtual: emProcesso ? ANALISTAS[i % ANALISTAS.length] : null,
    dataAssinatura,
    dataVencimento,
    analiseTecnica: status !== 'em_analise' && i % 3 === 0
      ? 'Minuta revisada, ajustar cláusula 8.2 (rescisão) antes de seguir para aprovação.'
      : '',
    historico: [
      { data: dataSolicitacao, evento: 'Solicitação criada', usuario: SOLICITANTES[i % SOLICITANTES.length] },
    ],
    tratativas: i % 3 === 0
      ? [{ data: addDays(dataSolicitacao, 2), usuario: ANALISTAS[i % ANALISTAS.length], observacao: 'Contato realizado com o cliente para alinhar cláusulas contratuais.' }]
      : [],
  }
}

export const mockContratos = Array.from({ length: 28 }, (_, i) => buildContrato(i))
