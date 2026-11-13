import { describe, expect, it } from 'vitest'
import { corpsBonLivraison, modeleBonLivraison } from './bonLivraison.js'

const produits = {
  'produit-1': { nom: 'Ketchup Burger Classique', prix: 3500 },
  'produit-4': { nom: 'Jus de bissap', prix: 1000 },
}

// Commande telle qu'envoyee par l'App Client (prix figes sur les lignes).
const commandeApp = {
  id: 'demo-2041',
  canal: 'APP',
  mode: 'LIVRAISON',
  statut: 'EN_LIVRAISON',
  moyenPaiement: 'wave',
  statutPaiement: 'paye',
  clientPrenom: 'Fatou',
  clientNom: 'Diallo',
  clientTelephone: '+221770000000',
  adresseLivraison: 'Almadies',
  positionLivraison: { latitude: 14.7389, longitude: -17.5013, precision: 12 },
  note: 'Villa 12, portail vert',
  lignes: [
    { produitId: 'produit-1', nom: 'Ketchup Burger Classique', prixUnitaire: 4500, quantite: 1, accompagnementNom: 'Alloco', accompagnementPrix: 1000 },
    { produitId: 'produit-4', nom: 'Jus de bissap', prixUnitaire: 1000, quantite: 2 },
  ],
  sousTotal: 6500,
  fraisLivraison: 1000,
  total: 7500,
  creeLe: '2026-11-13T11:30:00Z',
}

describe('bon de livraison', () => {
  it('reprend client, zone, note, prix figés, frais, total, paiement et itinéraire', () => {
    const m = modeleBonLivraison(commandeApp, produits)
    expect(m.eyebrow).toBe('Bon de livraison')
    expect(m.idTicket).toBe('2041')
    expect(m.client).toEqual([
      ['Client', 'Fatou Diallo'],
      ['Téléphone', '+221 77 000 00 00'],
      ['Zone', 'Almadies'],
    ])
    expect(m.note).toBe('Villa 12, portail vert')
    expect(m.lignes.map((l) => l.montant)).toEqual([4500, 2000])
    expect(m.lignes[0].details).toContain('+ Alloco')
    expect([m.sousTotal, m.frais, m.total]).toEqual([6500, 1000, 7500])
    expect(m.paiement).toBe('Wave')
    expect(m.paye).toBe(true)
    expect(m.itineraire).toBe('https://www.google.com/maps/dir/?api=1&destination=14.7389,-17.5013')
  })

  it('reprend les prix du catalogue quand la ligne n’en porte pas (comptoir / démo)', () => {
    const m = modeleBonLivraison(
      { id: 'demo-1044', canal: 'COMPTOIR', mode: 'RETRAIT', statut: 'PRETE', lignes: [{ produitId: 'produit-1', quantite: 2 }] },
      produits,
    )
    expect(m.eyebrow).toBe('Ticket de commande')
    expect(m.lignes[0].montant).toBe(7000)
    expect(m.total).toBe(7000)
    expect(m.itineraire).toBeNull()
  })

  it('masque les prix si l’un d’eux est inconnu', () => {
    const m = modeleBonLivraison({ id: 'x', mode: 'LIVRAISON', lignes: [{ produitId: 'inconnu', quantite: 1 }] }, produits)
    expect(m.prixConnus).toBe(false)
  })

  it('produit un ticket imprimable avec le QR code d’itinéraire', async () => {
    const html = await corpsBonLivraison(commandeApp, produits)
    expect(html).toContain('Ticket n° 2041')
    expect(html).toContain('Almadies')
    expect(html).toContain('<svg')
    expect(html).toContain('Scanner pour l’itinéraire GPS')
  })
})
