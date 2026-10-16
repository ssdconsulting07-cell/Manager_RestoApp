import { describe, expect, it, vi } from 'vitest'
import { apiPost } from '../../api/client.js'
import { allowedTransitions } from '../../auth/transitions.js'
import { getDemoCommandes, patchDemoStatut } from '../cuisine/cuisineDemo.js'
import { creerCommandeComptoir } from './commandeComptoir.js'

// Pas de vrai backend Commandes a ce jour (package vide, voir
// commandesData.js) : apiPost rejette toujours ici, exactement comme en
// developpement reel tant que l'API ne repond pas — creerCommandeComptoir
// doit alors retomber sur le store demo partage avec la Cuisine/le Livreur
// (decision du 16/10/2026, audit de coherence des flux, point 1).
vi.mock('../../api/client.js', () => ({
  apiPost: vi.fn(() => Promise.reject(new Error('pas de backend en test'))),
}))

describe('creerCommandeComptoir', () => {
  it('fait entrer une vente comptoir dans le meme cycle de vie que les commandes client', async () => {
    const panier = [
      { produitId: 'produit-1', quantite: 2, accompagnementNom: 'Frites' },
      { produitId: 'produit-3', quantite: 1 },
    ]

    const commande = await creerCommandeComptoir(panier)

    expect(apiPost).toHaveBeenCalledWith('/commandes', expect.objectContaining({ canal: 'COMPTOIR', mode: 'RETRAIT' }))
    expect(commande.statut).toBe('PAYEE')
    expect(commande.canal).toBe('COMPTOIR')
    expect(commande.mode).toBe('RETRAIT')
    expect(commande.lignes).toEqual([
      { produitId: 'produit-1', quantite: 2, accompagnementNom: 'Frites' },
      { produitId: 'produit-3', quantite: 1 },
    ])

    // Visible par la Cuisine (useCuisineBoard.js lit ce meme store demo) des
    // le prochain rafraichissement, sans que ce module n'ait rien su de
    // l'espace Vendeur.
    expect(getDemoCommandes().some((c) => c.id === commande.id)).toBe(true)

    // Une fois la Cuisine passee a PRETE : seul VENDEUR peut la remettre au
    // client (RETIREE), jamais CUISINE ni LIVREUR — et CUISINE garde la
    // possibilite d'annuler jusque-la (transitions.js, meme decision).
    const prete = patchDemoStatut(commande.id, 'PRETE')
    expect(allowedTransitions(prete, 'VENDEUR').map((t) => t.to)).toEqual(['RETIREE'])
    expect(allowedTransitions(prete, 'CUISINE').map((t) => t.to)).toEqual(['ANNULEE'])
    expect(allowedTransitions(prete, 'LIVREUR')).toEqual([])
  })
})
