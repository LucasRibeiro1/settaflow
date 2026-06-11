import { useState, useEffect } from 'react'
import { tratativaService } from '../services/tratativaService'
import { acordoService } from '../services/acordoService'

function toDateOnly(str) {
  if (!str) return null
  return String(str).slice(0, 10)
}

export function useNotifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = toDateOnly(new Date().toISOString())

    Promise.all([
      tratativaService.getTratativas().catch(() => []),
      acordoService.getAcordos().catch(() => []),
    ]).then(([tratativas, acordos]) => {
      const notifs = []

      // Tratativas: ações vencidas ou para hoje
      tratativas.forEach((t) => {
        const dt = toDateOnly(t.dataProximaAcao)
        if (!dt) return
        if (dt === today) {
          notifs.push({
            id: `trat-${t.id}`,
            type: 'acao_hoje',
            icon: '⚡',
            title: 'Ação programada para hoje',
            subtitle: t.clienteNome || t.clienteId,
            detail: t.proximaAcao || '',
            urgent: false,
            link: t.clienteId ? `/carteira/${t.clienteId}` : '/tratativas',
          })
        } else if (dt < today) {
          notifs.push({
            id: `trat-atras-${t.id}`,
            type: 'acao_atrasada',
            icon: '⚠',
            title: 'Ação em atraso',
            subtitle: t.clienteNome || t.clienteId,
            detail: `Venceu em ${dt.split('-').reverse().join('/')}`,
            urgent: true,
            link: t.clienteId ? `/carteira/${t.clienteId}` : '/tratativas',
          })
        }
      })

      // Acordos vencendo hoje ou em atraso (em_aberto)
      acordos.forEach((a) => {
        const dt = toDateOnly(a.vencimentoPrimeiraParcela || a.dataAcordo)
        if (!dt || a.status !== 'em_aberto') return
        if (dt === today) {
          notifs.push({
            id: `acord-${a.id}`,
            type: 'acordo_hoje',
            icon: '🤝',
            title: 'Parcela de acordo vence hoje',
            subtitle: a.clienteNome || a.clienteId,
            detail: `R$ ${parseFloat(a.valorParcela || 0).toFixed(2).replace('.', ',')}`,
            urgent: false,
            link: a.clienteId ? `/carteira/${a.clienteId}` : '/acordos',
          })
        } else if (dt < today) {
          notifs.push({
            id: `acord-atras-${a.id}`,
            type: 'acordo_atrasado',
            icon: '🔴',
            title: 'Parcela de acordo em atraso',
            subtitle: a.clienteNome || a.clienteId,
            detail: `Venceu em ${dt.split('-').reverse().join('/')}`,
            urgent: true,
            link: a.clienteId ? `/carteira/${a.clienteId}` : '/acordos',
          })
        }
      })

      // Ordenar: urgentes primeiro
      notifs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
      setItems(notifs)
    }).finally(() => setLoading(false))
  }, [])

  return { items, total: items.length, loading }
}
