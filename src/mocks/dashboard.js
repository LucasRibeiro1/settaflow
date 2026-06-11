export const mockDashboard = {
  resumo: {
    totalClientesInadimplentes: 8,
    valorTotalAberto: 1003621.00,
    totalTitulosVencidos: 50,
    clientesSemContatoMais30Dias: 3,
    promessasPendentes: 2,
    valorPrevistoRecebimento: 96267.00,
  },

  inadimplenciaGlobal: {
    totalClientes: 120,
    clientesInadimplentes: 8,
    percentualClientes: 6.7,
    limiteCreditoTotal: 4500000,
    valorEmAberto: 1003621,
    percentualValor: 22.3,
    metaRecuperacao: 150000,
    recuperadoMes: 96267,
    percentualMeta: 64.2,
  },

  clientesPorFaixaAtraso: [
    { faixa: '1-30d', quantidade: 12, valor: 98450.00 },
    { faixa: '31-60d', quantidade: 18, valor: 234600.00 },
    { faixa: '61-90d', quantidade: 9, valor: 187320.00 },
    { faixa: '91-120d', quantidade: 6, valor: 145800.00 },
    { faixa: '+120d', quantidade: 5, valor: 337451.00 },
  ],

  clientesPorStatus: [
    { status: 'Sem Contato', quantidade: 2, cor: '#ef4444' },
    { status: 'Em Cobrança', quantidade: 2, cor: '#f59e0b' },
    { status: 'Negociação', quantidade: 1, cor: '#8b5cf6' },
    { status: 'Promessa Pgto', quantidade: 1, cor: '#06b6d4' },
    { status: 'Aguardando', quantidade: 1, cor: '#f97316' },
    { status: 'Acordo', quantidade: 1, cor: '#10b981' },
  ],

  evolucaoMensal: [
    { mes: 'Jan', inadimplencia: 920000, recuperacao: 85000 },
    { mes: 'Fev', inadimplencia: 945000, recuperacao: 92000 },
    { mes: 'Mar', inadimplencia: 987000, recuperacao: 78000 },
    { mes: 'Abr', inadimplencia: 1025000, recuperacao: 105000 },
    { mes: 'Mai', inadimplencia: 1050000, recuperacao: 118000 },
    { mes: 'Jun', inadimplencia: 1003621, recuperacao: 96267 },
  ],

  maioresDevedores: [
    { id: 4, nome: 'Tech Soluções Informática Ltda', valor: 298750.00, diasAtraso: 210 },
    { id: 2, nome: 'Comercial Sul Comércio S/A', valor: 134200.00, diasAtraso: 145 },
    { id: 5, nome: 'Agropecuária Centro-Oeste Ltda', valor: 189300.25, diasAtraso: 75 },
    { id: 8, nome: 'Atacado Pronto Entrega Ltda', valor: 156780.50, diasAtraso: 180 },
    { id: 1, nome: 'Distribuidora Norte Ltda', valor: 87450.50, diasAtraso: 92 },
  ],
}

export const mockFilaTrabalho = [
  {
    id: 2,
    clienteId: 2,
    clienteNome: 'Comercial Sul Comércio S/A',
    clienteCodigo: 'CLI002',
    motivo: 'Retorno agendado para hoje',
    acao: 'Enviar proposta de acordo',
    valorAberto: 134200.00,
    prioridade: 'alta',
  },
  {
    id: 5,
    clienteId: 5,
    clienteNome: 'Agropecuária Centro-Oeste Ltda',
    clienteCodigo: 'CLI005',
    motivo: 'Reunião agendada para hoje',
    acao: 'Reunião presencial',
    valorAberto: 189300.25,
    prioridade: 'alta',
  },
  {
    id: 4,
    clienteId: 4,
    clienteNome: 'Tech Soluções Informática Ltda',
    clienteCodigo: 'CLI004',
    motivo: 'Sem contato há 85 dias',
    acao: 'Tentativa urgente de contato',
    valorAberto: 298750.00,
    prioridade: 'critica',
  },
  {
    id: 8,
    clienteId: 8,
    clienteNome: 'Atacado Pronto Entrega Ltda',
    clienteCodigo: 'CLI008',
    motivo: 'Sem contato há 113 dias',
    acao: 'Notificação extrajudicial',
    valorAberto: 156780.50,
    prioridade: 'critica',
  },
  {
    id: 3,
    clienteId: 3,
    clienteNome: 'Indústria Leste Produtos ME',
    clienteCodigo: 'CLI003',
    motivo: 'Promessa de pagamento vence em 2 dias',
    acao: 'Confirmar pagamento',
    valorAberto: 45800.75,
    prioridade: 'media',
  },
]
