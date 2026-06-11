export function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date) {
  if (!date) return '—'
  let d
  if (date instanceof Date) {
    d = date
  } else {
    const s = String(date)
    // Evita offset de fuso ao parsear datas sem horário
    d = new Date(s.includes('T') ? s : s + 'T00:00:00')
  }
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export function formatDatetime(datetime) {
  if (!datetime) return '—'
  const d = datetime instanceof Date ? datetime : new Date(datetime)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatCNPJ(cnpj) {
  if (!cnpj) return ''
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone) {
  if (!phone) return ''
  return phone
}

export function formatDays(days) {
  if (days == null) return '—'
  if (days === 0) return 'Hoje'
  if (days === 1) return '1 dia'
  return `${days} dias`
}

export const STATUS_LABELS = {
  sem_contato: 'Sem Contato',
  em_cobranca: 'Em Cobrança',
  negociacao: 'Negociação',
  promessa_pagamento: 'Promessa Pgto',
  aguardando_retorno: 'Aguard. Retorno',
  acordo_realizado: 'Acordo Realizado',
  cobranca_encerrada: 'Encerrado',
}

export const STATUS_COLORS = {
  sem_contato: 'danger',
  em_cobranca: 'warning',
  negociacao: 'purple',
  promessa_pagamento: 'info',
  aguardando_retorno: 'warning',
  acordo_realizado: 'success',
  cobranca_encerrada: 'default',
}

export const TIPO_CONTATO_LABELS = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita: 'Visita',
  reuniao: 'Reunião',
  outros: 'Outros',
}

export const TIPO_CONTATO_ICONS = {
  ligacao: '📞',
  whatsapp: '💬',
  email: '📧',
  visita: '🏢',
  reuniao: '🤝',
  outros: '📋',
}

export const ACORDO_STATUS_LABELS = {
  em_aberto: 'Em Aberto',
  cumprido: 'Cumprido',
  quebrado: 'Quebrado',
  cancelado: 'Cancelado',
}

export const ACORDO_STATUS_COLORS = {
  em_aberto: 'info',
  cumprido: 'success',
  quebrado: 'danger',
  cancelado: 'default',
}

export const PRIORIDADE_LABELS = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const PRIORIDADE_COLORS = {
  critica: 'danger',
  alta: 'warning',
  media: 'info',
  baixa: 'success',
}

export function getFaixaAtraso(dias) {
  if (dias <= 30) return '1-30 dias'
  if (dias <= 60) return '31-60 dias'
  if (dias <= 90) return '61-90 dias'
  if (dias <= 120) return '91-120 dias'
  return '> 120 dias'
}
