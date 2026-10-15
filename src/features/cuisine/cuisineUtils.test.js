import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comparerPriorite, estUrgente } from './cuisineUtils.js'

// Horloge figee : l'urgence depend de Date.now() (seuil de 20 min).
const MAINTENANT = new Date('2026-10-15T12:00:00Z').getTime()

function commande(id, minutesAvant, canal = 'APP') {
  return { id, canal, creeLe: new Date(MAINTENANT - minutesAvant * 60_000).toISOString() }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(MAINTENANT)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('estUrgente', () => {
  it('ne considère une commande en retard qu’au-delà de 20 min', () => {
    expect(estUrgente(commande('a', 20))).toBe(false)
    expect(estUrgente(commande('b', 21))).toBe(true)
  })
})

describe('comparerPriorite', () => {
  it('place les commandes en retard en tête, puis FIFO, puis « Sur place » avant « App » à égalité', () => {
    const recenteApp = commande('recente-app', 5)
    const ancienneApp = commande('ancienne-app', 15)
    const retardRecente = commande('retard-recente', 22)
    const retardAncienne = commande('retard-ancienne', 30)
    const egaliteApp = commande('egalite-app', 10, 'APP')
    const egaliteComptoir = commande('egalite-comptoir', 10, 'COMPTOIR')

    const triees = [recenteApp, egaliteApp, retardRecente, ancienneApp, egaliteComptoir, retardAncienne]
      .sort(comparerPriorite)
      .map((c) => c.id)

    expect(triees).toEqual([
      'retard-ancienne',
      'retard-recente',
      'ancienne-app',
      'egalite-comptoir',
      'egalite-app',
      'recente-app',
    ])
  })
})
