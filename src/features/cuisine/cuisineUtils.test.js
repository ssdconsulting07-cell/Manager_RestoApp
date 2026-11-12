import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comparerPriorite, estUrgente, mapProduitsParId, nomProduit, photoProduit, resumePlats } from './cuisineUtils.js'

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

// Lignes envoyees par l App Client (Client_RestoApp) : nom fige sur la
// ligne, plats du jour absents du catalogue /produits, photo en photoUrl.
describe("lignes de commande de l App Client", () => {
  const produits = mapProduitsParId([
    { id: "produit-1", nom: "Ketchup Burger Classique", photoUrl: "https://exemple/burger.jpg" },
  ])

  it("utilise le nom fige sur la ligne en priorite", () => {
    expect(nomProduit(produits, { produitId: "produit-1", nom: "Burger (nom a la commande)" })).toBe("Burger (nom a la commande)")
  })

  it("affiche un plat du jour absent du catalogue grace au nom de la ligne", () => {
    expect(nomProduit(produits, { produitId: "plat-jour-1", type: "PLAT_DU_JOUR", nom: "Thiéboudienne" })).toBe("Thiéboudienne")
    expect(resumePlats([{ produitId: "plat-jour-1", quantite: 2, nom: "Thiéboudienne" }], produits)).toBe("2× Thiéboudienne")
  })

  it("garde le repli catalogue pour une ligne sans nom (comptoir, demo)", () => {
    expect(nomProduit(produits, { produitId: "produit-1" })).toBe("Ketchup Burger Classique")
    expect(nomProduit(produits, "produit-1")).toBe("Ketchup Burger Classique")
  })

  it("lit la photo du Gerant (photoUrl)", () => {
    expect(photoProduit(produits, { produitId: "produit-1" })).toBe("https://exemple/burger.jpg")
  })
})
