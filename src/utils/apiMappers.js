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
  // COD_CLI = CODCLI + LOJA concatenados (ex: "00194701" = "001947" + "01")
  const codCliRaw = String(raw.COD_CLI ?? raw.CODCLI ?? raw.codcli ?? '').trim()
  const loja = codCliRaw.length >= 2 ? codCliRaw.slice(-2) : '01'
  const codcli = codCliRaw.length >= 2 ? codCliRaw.slice(0, -2) : codCliRaw
  const empresa = String(raw.EMPRESA ?? raw.FILIAL ?? raw.filial ?? '').trim()
  const clienteKey = `${codcli}-${loja}`
  const cliente = clienteMap?.[clienteKey]

  const vencimentoOriginal = parseProtheusDate(raw.VENCIMENTO ?? raw.DTVENCTO ?? raw.dtvencto)
  const vencimentoReal = parseProtheusDate(raw.REPROGRAMADO ?? raw.DTVENCREA ?? raw.dtvencrea)

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  // Regra de vencimento baseada em E1_VENCTO (VENCIMENTO original)
  const isVencido = vencimentoOriginal !== null && vencimentoOriginal < hoje
  const aVencer = vencimentoOriginal !== null && vencimentoOriginal.getTime() === hoje.getTime()
  const diasAtraso = calcDiasAtraso(vencimentoOriginal)

  const emissao = parseProtheusDate(raw.EMISSAO ?? raw.DTEMISSAO ?? raw.dtemissao)
  const dtBaixa = parseProtheusDate(raw.BAIXA ?? raw.DTBAIXA ?? raw.dtbaixa)

  const numero = String(raw.TITULO ?? raw.NUMERO ?? raw.numero ?? '').trim()
  const prefixo = String(raw.PREFIXO ?? raw.prefixo ?? '').trim()
  const parcela = String(raw.PARCELA ?? raw.parcela ?? '').trim()

  return {
    id: `${empresa}-${prefixo}-${numero}-${parcela}-${codcli}-${loja}-${raw.VENCIMENTO ?? raw.DTVENCTO ?? ''}`,
    filial: empresa,
    clienteId: clienteKey,
    clienteCodigo: codcli,
    clienteNome: String(raw.CLIENTE ?? cliente?.razaoSocial ?? codcli).trim(),
    grupoCliente: cliente?.grupoCliente || raw.GRUPO_VEN || '—',
    prefixo,
    titulo: numero,
    parcela,
    tipo: String(raw.TIPO ?? raw.ESPECIE ?? raw.especie ?? '').trim() || '—',
    emissao,
    vencimentoOriginal,
    vencimentoReal,
    vencimento: vencimentoReal || vencimentoOriginal,
    dtBaixa,
    diasAtraso,
    isVencido,
    aVencer,
    valorOriginal: parseFloat(raw.VALOR ?? 0) || 0,
    saldoAtual: parseFloat(raw.SALDO ?? 0) || 0,
    vendedor: String(raw.GRUPO_VEN ?? raw.VENDEDOR ?? raw.vendedor ?? '').trim(),
    historico: String(raw.HISTORICO ?? '').trim(),
    natureza: String(raw.NATUREZA ?? '').trim(),
    inadimplencia: String(raw.INADIMPLENCIA ?? '').trim(),
    motivo: String(raw.MOTIVO ?? '').trim(),
    pedido: String(raw.PEDIDO ?? '').trim(),
  }
}

// Replica filtros da query SQL: E1_TIPO NOT IN('RA','NCC') e E1_EMISSAO >= '20170101'
const TIPOS_EXCLUIDOS = new Set(['RA', 'NCC'])
const EMISSAO_MIN = new Date(2017, 0, 1)
function isTituloValido(t) {
  if (TIPOS_EXCLUIDOS.has((t.tipo ?? '').trim().toUpperCase())) return false
  if (t.emissao && t.emissao < EMISSAO_MIN) return false
  return true
}

export function enrichClientesWithTitulos(clientes, titulos) {
  const map = new Map(
    clientes.map((c) => [
      c.id,
      { ...c, valorTotalAberto: 0, qtdTitulosVencidos: 0, maiorAtraso: 0, atrasoMedio: 0, somaValorVencido: 0, somaValorDiasAtraso: 0, ultimoPagamento: null },
    ])
  )

  for (const t of titulos) {
    const c = map.get(t.clienteId)
    if (!c || !isTituloValido(t)) continue

    if (t.dtBaixa && t.saldoAtual <= 0) {
      // Título totalmente pago: registra último pagamento
      if (!c.ultimoPagamento || t.dtBaixa > c.ultimoPagamento) {
        c.ultimoPagamento = t.dtBaixa
      }
    } else if (t.saldoAtual !== 0) {
      // SQL garante E1_SALDO > 0; IS-/IN- retornam negativo e reduzem o total corretamente
      c.valorTotalAberto += t.saldoAtual
      if (t.isVencido) {
        c.qtdTitulosVencidos += 1
        if (t.diasAtraso > c.maiorAtraso) c.maiorAtraso = t.diasAtraso
        // Acumuladores para prazo médio ponderado: Σ(saldo × dias) / Σ(saldo em atraso)
        const saldo = Math.abs(t.saldoAtual)
        c.somaValorDiasAtraso += saldo * t.diasAtraso
        c.somaValorVencido    += saldo
      }
    }
  }

  // Calcula atrasoMedio (prazo médio ponderado) e deriva statusCobranca
  for (const [, c] of map) {
    c.atrasoMedio = c.somaValorVencido > 0
      ? parseFloat((c.somaValorDiasAtraso / (c.somaValorVencido * 100)).toFixed(2))
      : 0
    if (c.maiorAtraso > 180) c.statusCobranca = 'critica'
    else if (c.maiorAtraso > 90) c.statusCobranca = 'alta'
    else if (c.maiorAtraso > 30) c.statusCobranca = 'media'
    else c.statusCobranca = 'baixa'
  }

  return Array.from(map.values())
}

const STATUS_CONFIG = {
  sem_contato:        { label: 'Sem Contato',     cor: '#94a3b8' },
  em_cobranca:        { label: 'Em Cobrança',     cor: '#f59e0b' },
  negociacao:         { label: 'Negociação',      cor: '#8b5cf6' },
  promessa_pagamento: { label: 'Promessa Pgto',   cor: '#06b6d4' },
  aguardando_retorno: { label: 'Aguardando',      cor: '#f97316' },
  acordo_realizado:   { label: 'Acordo',          cor: '#10b981' },
  sem_acordo:         { label: 'Sem Acordo',      cor: '#dc2626' },
}

export function computeDashboard(clientes, titulos, tratativas = []) {
  // SQL já garante E1_SALDO > 0 no WHERE; IS-/IN- retornam saldo negativo da API
  const titulosAbertos = titulos.filter((t) => isTituloValido(t))
  const titulosVencidos = titulosAbertos.filter((t) => t.isVencido)

  const clientesComAtraso = clientes.filter((c) => c.qtdTitulosVencidos > 0)
  const limiteCreditoTotal = clientes.reduce((s, c) => s + c.limiteCredito, 0)
  const valorTotalAberto = clientesComAtraso.reduce((s, c) => s + c.valorTotalAberto, 0)

  // Card "Clientes Inadimplentes": grupos 000001 e 000027 contam por cliente;
  // demais grupos contam uma vez por grupo (clientes sem grupo contam individualmente)
  const GRUPOS_POR_CLIENTE = new Set(['000001', '000027'])
  const gruposJaContados = new Set()
  let totalClientesInadimplentes = 0
  for (const c of clientesComAtraso) {
    const g = c.grupoCliente && c.grupoCliente !== '—' ? c.grupoCliente : null
    if (!g) {
      // sem grupo — não contabiliza
    } else if (GRUPOS_POR_CLIENTE.has(g)) {
      totalClientesInadimplentes++
    } else if (!gruposJaContados.has(g)) {
      gruposJaContados.add(g)
      totalClientesInadimplentes++
    }
  }

  // Faixas: cada cliente conta em uma única faixa (sua pior, maiorAtraso)
  const faixaBuckets = {
    '1-30d': { faixa: '1-30d', quantidade: 0, valor: 0 },
    '31-60d': { faixa: '31-60d', quantidade: 0, valor: 0 },
    '61-90d': { faixa: '61-90d', quantidade: 0, valor: 0 },
    '91-180d': { faixa: '91-180d', quantidade: 0, valor: 0 },
    '+180d': { faixa: '+180d', quantidade: 0, valor: 0 },
  }
  for (const c of clientesComAtraso) {
    const d = c.maiorAtraso
    const key = d <= 30 ? '1-30d' : d <= 60 ? '31-60d' : d <= 90 ? '61-90d' : d <= 180 ? '91-180d' : '+180d'
    faixaBuckets[key].quantidade++
    faixaBuckets[key].valor += c.valorTotalAberto
  }

  // Status distribution: última tratativa por cliente → sem_contato se não houver
  const ultimaTratativaStatus = {}
  for (const t of tratativas) {
    const cid = String(t.clienteId)
    const atual = ultimaTratativaStatus[cid]
    if (!atual || (t.dataHora && (!atual.dataHora || t.dataHora > atual.dataHora))) {
      ultimaTratativaStatus[cid] = t
    }
  }

  const statusCount = {}
  for (const c of clientesComAtraso) {
    const ultima = ultimaTratativaStatus[String(c.id)]
    const key = ultima?.status || 'sem_contato'
    statusCount[key] = (statusCount[key] || 0) + 1
  }

  const STATUS_ORDER = ['sem_contato', 'em_cobranca', 'negociacao', 'promessa_pagamento', 'aguardando_retorno', 'acordo_realizado', 'sem_acordo']
  const clientesPorStatus = STATUS_ORDER
    .filter((key) => statusCount[key])
    .map((key) => ({
      status: STATUS_CONFIG[key]?.label || key,
      quantidade: statusCount[key],
      cor: STATUS_CONFIG[key]?.cor || '#94a3b8',
    }))

  const devedoresOrdenados = [...clientesComAtraso]
    .sort((a, b) => b.valorTotalAberto - a.valorTotalAberto)
    .map((c) => ({
      id: c.id,
      nome: c.nomeFantasia || c.razaoSocial,
      valor: c.valorTotalAberto,
      diasAtraso: c.maiorAtraso,
    }))

  const maioresDevedores = devedoresOrdenados.slice(0, 10)
  const todosDevedores = devedoresOrdenados

  // API já retorna SALDO negativo para tipos IS-/IN-, soma direta
  const saldoTotalAberto = titulosAbertos.reduce((s, t) => s + t.saldoAtual, 0)
  const saldoTotalVencido = titulosVencidos.reduce((s, t) => s + t.saldoAtual, 0)
  const saldoTotalJuridico = titulosVencidos
    .filter((t) => t.inadimplencia === '3')
    .reduce((s, t) => s + t.saldoAtual, 0)

  // Composição da carteira: jurídico + vencido restante + em dia
  const absJuridico = Math.abs(saldoTotalJuridico)
  const absVencido  = Math.abs(saldoTotalVencido)
  const composicaoCarteira = [
    { name: 'Jurídico',      value: absJuridico,                          fill: '#dc2626' },
    { name: 'Total Vencido', value: Math.max(0, absVencido - absJuridico), fill: '#c2410c' },
    { name: 'Total em Dia',  value: Math.max(0, saldoTotalAberto - absVencido), fill: '#2563eb' },
  ]

  // Histórico acumulado de vencidos por mês (E1_VENCTO) — preenche todos os meses
  const mesMap = {}
  for (const t of titulosVencidos) {
    if (!t.vencimentoOriginal) continue
    const y = t.vencimentoOriginal.getFullYear()
    const m = t.vencimentoOriginal.getMonth() + 1
    const key = `${y}-${String(m).padStart(2, '0')}`
    mesMap[key] = (mesMap[key] || 0) + Math.abs(t.saldoAtual)
  }
  // Preenche meses sem dados entre o primeiro e o mês atual
  const mesKeysExistentes = Object.keys(mesMap).sort()
  if (mesKeysExistentes.length > 0) {
    const hojeRef = new Date()
    const [iy, im] = mesKeysExistentes[0].split('-').map(Number)
    let cy = iy, cm = im
    const endY = hojeRef.getFullYear()
    const endM = hojeRef.getMonth() + 1
    while (cy < endY || (cy === endY && cm <= endM)) {
      const key = `${cy}-${String(cm).padStart(2, '0')}`
      if (!(key in mesMap)) mesMap[key] = 0
      cm++
      if (cm > 12) { cm = 1; cy++ }
    }
  }
  // Acumulado crescente (running total)
  let acumuladoMes = 0
  const evolucaoMensal = Object.keys(mesMap)
    .sort()
    .map((key) => {
      acumuladoMes += mesMap[key]
      return {
        mes: `${String(parseInt(key.slice(5), 10)).padStart(2, '0')}/${key.slice(2, 4)}`,
        saldoVencido: acumuladoMes,
      }
    })

  const percInadimplencia = saldoTotalAberto > 0
    ? parseFloat(((saldoTotalVencido / saldoTotalAberto) * 100).toFixed(1))
    : 0

  return {
    resumo: {
      totalClientesInadimplentes,
      valorTotalAberto,
      saldoTotalAberto,
      saldoTotalVencido,
      saldoTotalJuridico,
      totalTitulosVencidos: titulosVencidos.filter((t) => t.tipo === 'NF' || t.tipo === 'ADI' || t.tipo === 'PR').length,
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
    composicaoCarteira,
    percInadimplencia,
    clientesPorFaixaAtraso: Object.values(faixaBuckets),
    clientesPorStatus,
    evolucaoMensal,
    maioresDevedores,
    todosDevedores,
  }
}
