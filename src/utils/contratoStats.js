import { EMPRESA_LABELS, ESPECIE_LABELS, TIPO_CONTRATO_LABELS, CONTRATO_STATUS_LABELS } from './contratoConstants'

const ATIVOS = ['em_analise', 'analise_tecnica', 'aprovacao', 'assinatura', 'vigente']

function diffDias(a, b) {
  if (!a || !b) return null
  const d1 = new Date(a)
  const d2 = new Date(b)
  return Math.round((d2 - d1) / 86400000)
}

function contarPor(contratos, campo, labelMap) {
  const buckets = {}
  for (const c of contratos) {
    const chave = c[campo]
    if (!chave) continue
    buckets[chave] = (buckets[chave] || 0) + 1
  }
  return Object.entries(buckets)
    .map(([chave, quantidade]) => ({ chave, label: labelMap?.[chave] || chave, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

export function computeContratoDashboard(contratos) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const total = contratos.length
  const ativos = contratos.filter((c) => ATIVOS.includes(c.status)).length
  const vigentes = contratos.filter((c) => c.status === 'vigente').length
  const vencidos = contratos.filter((c) => c.status === 'vencido').length
  const encerrados = contratos.filter((c) => c.status === 'encerrado').length
  const reprovados = contratos.filter((c) => c.status === 'reprovado').length

  const vencendoEm30Dias = contratos.filter((c) => {
    if (c.status !== 'vigente' || !c.dataVencimento) return false
    const dias = diffDias(hoje.toISOString().slice(0, 10), c.dataVencimento)
    return dias !== null && dias >= 0 && dias <= 30
  }).sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))

  const comSeguro = contratos.filter((c) => c.seguroGarantia === 'sim').length
  const semSeguro = total - comSeguro

  const porEmpresa = contarPor(contratos, 'empresa', EMPRESA_LABELS)
  const porTipoContrato = contarPor(contratos, 'tipoContrato', TIPO_CONTRATO_LABELS)
  const porEspecie = contarPor(contratos, 'especie', ESPECIE_LABELS)
  const porStatus = contarPor(contratos, 'status', CONTRATO_STATUS_LABELS)

  // Tempo médio (dias) entre solicitação e assinatura, para contratos já assinados
  const assinados = contratos.filter((c) => c.dataAssinatura)
  const tempoMedioAprovacao = assinados.length
    ? Math.round(assinados.reduce((s, c) => s + (diffDias(c.dataSolicitacao, c.dataAssinatura) || 0), 0) / assinados.length)
    : 0

  // Evolução mensal de solicitações
  const mesMap = {}
  for (const c of contratos) {
    if (!c.dataSolicitacao) continue
    const key = c.dataSolicitacao.slice(0, 7) // YYYY-MM
    mesMap[key] = (mesMap[key] || 0) + 1
  }
  const evolucaoMensal = Object.keys(mesMap).sort().map((key) => ({
    mes: `${key.slice(5, 7)}/${key.slice(2, 4)}`,
    quantidade: mesMap[key],
  }))

  return {
    total,
    ativos,
    vigentes,
    vencidos,
    encerrados,
    reprovados,
    comSeguro,
    semSeguro,
    vencendoEm30Dias,
    tempoMedioAprovacao,
    porEmpresa,
    porTipoContrato,
    porEspecie,
    porStatus,
    evolucaoMensal,
  }
}
