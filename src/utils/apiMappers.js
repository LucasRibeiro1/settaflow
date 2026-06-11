const UF_REGIAO = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste',
  PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
}

// Aceita YYYYMMDD, YYYY-MM-DD ou DD/MM/YYYY
export function parseProtheusDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const s = dateStr.trim()
  if (!s || s === '00000000' || s === '        ') return null

  if (/^\d{8}$/.test(s)) {
    const y = parseInt(s.slice(0, 4), 10)
    const m = parseInt(s.slice(4, 6), 10) - 1
    const d = parseInt(s.slice(6, 8), 10)
    if (y < 1900 || m < 0 || m > 11 || d < 1) return null
    const dt = new Date(y, m, d)
    return isNaN(dt.getTime()) ? null : dt
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const dt = new Date(s.slice(0, 10))
    return isNaN(dt.getTime()) ? null : dt
  }

  const parts = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (parts) {
    const dt = new Date(parseInt(parts[3], 10), parseInt(parts[2], 10) - 1, parseInt(parts[1], 10))
    return isNaN(dt.getTime()) ? null : dt
  }

  return null
}

export function calcDiasAtraso(vencDate) {
  if (!vencDate) return 0
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((hoje - vencDate) / 86400000))
}

// Extrai array de qualquer formato de resposta Protheus
export function extractArray(response) {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []
  for (const key of ['dados', 'resultado', 'items', 'data', 'result', 'lista', 'clientes', 'titulos']) {
    if (Array.isArray(response[key])) return response[key]
  }
  const found = Object.values(response).find((v) => Array.isArray(v))
  return found || []
}

export function mapCliente(raw) {
  const codigo = String(raw.CODIGO ?? raw.codigo ?? '').trim()
  const loja = String(raw.LOJA ?? raw.loja ?? '01').trim()
  const uf = String(raw.ESTADO ?? raw.estado ?? '').trim().toUpperCase()

  const emailRaw = String(raw.EMAIL ?? raw.email ?? '').trim()
  const emails = emailRaw ? emailRaw.split(/[;,]/).map((e) => e.trim()).filter(Boolean) : []

  const telRaw = String(raw.TELEFONE ?? raw.telefone ?? '').trim()
  const telefones = telRaw ? telRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : []

  return {
    id: `${codigo}-${loja}`,
    codigo,
    loja,
    filial: String(raw.FILIAL ?? raw.filial ?? '').trim(),
    razaoSocial: String(raw.NOME ?? raw.nome ?? '').trim(),
    nomeFantasia: String(raw.NREDUZ ?? raw.nreduz ?? '').trim(),
    cnpj: String(raw['CPF/CNPJ'] ?? raw.CNPJ ?? raw.cnpj ?? '').trim(),
    cidade: String(raw.MUNICIPIO ?? raw.municipio ?? '').trim(),
    uf,
    regiao: UF_REGIAO[uf] || 'Outros',
    grupoCliente: String(raw.GRUPOVENDA ?? raw.grupovenda ?? '').trim() || '—',
    emails,
    telefones,
    contato: String(raw.CONTATO ?? raw.contato ?? '').trim(),
    limiteCredito: parseFloat(raw.LIMITECREDITO ?? raw.limitecredito ?? 0) || 0,
    risco: String(raw.RISCO ?? raw.risco ?? '').trim(),
    vendedor: String(raw.VENDEDOR ?? raw.vendedor ?? '').trim(),
    valorTotalEmitido: parseFloat(raw.TOTAL_EMITIDO ?? raw.total_emitido ?? 0) || 0,
    valorPagoEmDia: parseFloat(raw.TOTAL_PAGO_EMDIA ?? raw.total_pago_emdia ?? 0) || 0,
    percAdimplencia: parseFloat(raw.PERC_ADIMPLENCIA ?? raw.perc_adimplencia ?? 0) || 0,
    // Preenchidos ao enriquecer com títulos
    valorTotalAberto: 0,
    qtdTitulosVencidos: 0,
    maiorAtraso: 0,
    ultimoPagamento: null,
    // Campos sem equivalente na API
    responsavelCobranca: '—',
    ultimoContato: null,
    proximaAcao: '—',
    dataProximaAcao: null,
    statusCobranca: 'em_cobranca',
    observacoes: '',
  }
}

export function mapTitulo(raw, clienteMap) {
  const codcli = String(raw.CODCLI ?? raw.codcli ?? '').trim()
  const loja = String(raw.LOJA ?? raw.loja ?? '01').trim()
  const filial = String(raw.FILIAL ?? raw.filial ?? '').trim()
  const clienteKey = `${codcli}-${loja}`
  const cliente = clienteMap?.[clienteKey]

  const vencimentoOriginal = parseProtheusDate(raw.DTVENCTO ?? raw.dtvencto)
  const vencimentoReal     = parseProtheusDate(raw.DTVENCREA ?? raw.dtvencrea)
  // Usa DTVENCREA quando disponível, senão DTVENCTO
  const vencEfetivo = vencimentoReal || vencimentoOriginal

  const emissao = parseProtheusDate(raw.DTEMISSAO ?? raw.dtemissao)
  const dtBaixa = parseProtheusDate(raw.DTBAIXA ?? raw.dtbaixa)
  const diasAtraso = calcDiasAtraso(vencEfetivo)

  const prefixo = String(raw.PREFIXO ?? raw.prefixo ?? '').trim()
  const numero = String(raw.NUMERO ?? raw.numero ?? '').trim()
  const parcela = String(raw.PARCELA ?? raw.parcela ?? '').trim()

  return {
    id: `${filial}-${prefixo}-${numero}-${parcela}-${codcli}-${loja}`,
    filial,
    clienteId: clienteKey,
    clienteCodigo: codcli,
    clienteNome: cliente?.razaoSocial || codcli,
    grupoCliente: cliente?.grupoCliente || '—',
    prefixo,
    titulo: numero,
    parcela,
    tipo: String(raw.ESPECIE ?? raw.especie ?? raw.TIPO ?? raw.tipo ?? '').trim() || '—',
    emissao,
    vencimentoOriginal,
    vencimentoReal,
    vencimento: vencEfetivo,
    dtBaixa,
    diasAtraso,
    valorOriginal: parseFloat(raw.VALOR ?? raw.valor ?? 0) || 0,
    saldoAtual: parseFloat(raw.SALDO ?? raw.saldo ?? 0) || 0,
    vendedor: String(raw.VENDEDOR ?? raw.vendedor ?? '').trim(),
  }
}

export function enrichClientesWithTitulos(clientes, titulos) {
  const map = new Map(
    clientes.map((c) => [
      c.id,
      { ...c, valorTotalAberto: 0, qtdTitulosVencidos: 0, maiorAtraso: 0, ultimoPagamento: null },
    ])
  )

  for (const t of titulos) {
    const c = map.get(t.clienteId)
    if (!c) continue

    if (t.dtBaixa) {
      // Título baixado (pago)
      if (!c.ultimoPagamento || t.dtBaixa > c.ultimoPagamento) {
        c.ultimoPagamento = t.dtBaixa
      }
    } else if (t.saldoAtual > 0) {
      // Título em aberto
      c.valorTotalAberto += t.saldoAtual
      if (t.diasAtraso > 0) {
        c.qtdTitulosVencidos += 1
        if (t.diasAtraso > c.maiorAtraso) c.maiorAtraso = t.diasAtraso
      }
    }
  }

  // Deriva statusCobranca a partir do risco e atraso máximo
  for (const [, c] of map) {
    if (c.risco === 'D' || c.maiorAtraso > 180) c.statusCobranca = 'sem_acordo'
    else if (c.maiorAtraso > 0) c.statusCobranca = 'em_cobranca'
    else c.statusCobranca = 'em_cobranca'
  }

  return Array.from(map.values())
}

const STATUS_CONFIG = {
  sem_contato:        { label: 'Sem Contato',    cor: '#ef4444' },
  em_cobranca:        { label: 'Em Cobrança',    cor: '#f59e0b' },
  negociacao:         { label: 'Negociação',     cor: '#8b5cf6' },
  promessa_pagamento: { label: 'Promessa Pgto',  cor: '#06b6d4' },
  aguardando_retorno: { label: 'Aguardando',     cor: '#f97316' },
  acordo_realizado:   { label: 'Acordo',         cor: '#10b981' },
  sem_acordo:         { label: 'Sem Acordo',     cor: '#dc2626' },
}

export function computeDashboard(clientes, titulos) {
  const titulosAbertos = titulos.filter((t) => !t.dtBaixa && t.saldoAtual > 0)
  const titulosVencidos = titulosAbertos.filter((t) => t.diasAtraso > 0)

  const clientesComAtraso = clientes.filter((c) => c.qtdTitulosVencidos > 0)
  const limiteCreditoTotal = clientes.reduce((s, c) => s + c.limiteCredito, 0)
  const valorTotalAberto = clientesComAtraso.reduce((s, c) => s + c.valorTotalAberto, 0)

  // Faixas: cada cliente conta em uma única faixa (sua pior, maiorAtraso)
  const faixaBuckets = {
    '1-30d':   { faixa: '1-30d',   quantidade: 0, valor: 0 },
    '31-60d':  { faixa: '31-60d',  quantidade: 0, valor: 0 },
    '61-90d':  { faixa: '61-90d',  quantidade: 0, valor: 0 },
    '91-180d': { faixa: '91-180d', quantidade: 0, valor: 0 },
    '+180d':   { faixa: '+180d',   quantidade: 0, valor: 0 },
  }
  for (const c of clientesComAtraso) {
    const d = c.maiorAtraso
    const key = d <= 30 ? '1-30d' : d <= 60 ? '31-60d' : d <= 90 ? '61-90d' : d <= 180 ? '91-180d' : '+180d'
    faixaBuckets[key].quantidade++
    faixaBuckets[key].valor += c.valorTotalAberto
  }

  // Status distribution
  const statusCount = {}
  for (const c of clientesComAtraso) {
    statusCount[c.statusCobranca] = (statusCount[c.statusCobranca] || 0) + 1
  }
  const clientesPorStatus = Object.entries(statusCount).map(([key, quantidade]) => ({
    status: STATUS_CONFIG[key]?.label || key,
    quantidade,
    cor: STATUS_CONFIG[key]?.cor || '#94a3b8',
  }))

  const maioresDevedores = [...clientesComAtraso]
    .sort((a, b) => b.valorTotalAberto - a.valorTotalAberto)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      nome: c.nomeFantasia || c.razaoSocial,
      valor: c.valorTotalAberto,
      diasAtraso: c.maiorAtraso,
    }))

  return {
    resumo: {
      totalClientesInadimplentes: clientesComAtraso.length,
      valorTotalAberto,
      totalTitulosVencidos: titulosVencidos.length,
      clientesSemContatoMais30Dias: clientesComAtraso.filter((c) => c.maiorAtraso > 30).length,
      promessasPendentes: 0,
      valorPrevistoRecebimento: 0,
    },
    inadimplenciaGlobal: {
      totalClientes: clientes.length,
      clientesInadimplentes: clientesComAtraso.length,
      percentualClientes:
        clientes.length > 0
          ? parseFloat(((clientesComAtraso.length / clientes.length) * 100).toFixed(1))
          : 0,
      limiteCreditoTotal,
      valorEmAberto: valorTotalAberto,
      percentualValor:
        limiteCreditoTotal > 0
          ? parseFloat(((valorTotalAberto / limiteCreditoTotal) * 100).toFixed(1))
          : 0,
      metaRecuperacao: 0,
      recuperadoMes: 0,
      percentualMeta: 0,
    },
    clientesPorFaixaAtraso: Object.values(faixaBuckets),
    clientesPorStatus,
    evolucaoMensal: [],
    maioresDevedores,
  }
}
