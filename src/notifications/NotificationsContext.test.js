import { describe, expect, it } from 'vitest'
import { notificationPour, tempsEcoule } from './NotificationsContext.jsx'

const livraison = { id: '1042', mode: 'LIVRAISON', canal: 'APP', total: 7000, adresseLivraison: 'Almadies' }
const retrait = { id: '1043', mode: 'RETRAIT', canal: 'COMPTOIR', total: 3500 }

describe('notifications par role', () => {
  it('Cuisine : seulement les nouvelles commandes payees', () => {
    const n = notificationPour('CUISINE', { type: 'COMMANDE_PAYEE', commande: { ...livraison, statut: 'PAYEE' } })
    expect(n).toMatchObject({ title: 'Nouvelle commande #1042', target: '/commandes', kind: 'commande' })
    expect(n.text.replace(/\s/g, ' ')).toContain('7 000 F CFA')
    expect(notificationPour('CUISINE', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'LIVREE' } })).toBeNull()
  })

  it('Livreur : livraison prete puis en route, jamais les retraits', () => {
    expect(notificationPour('LIVREUR', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'PRETE' } }))
      .toMatchObject({ title: 'Commande #1042 prête', target: '/livraisons' })
    expect(notificationPour('LIVREUR', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'EN_LIVRAISON' } })).not.toBeNull()
    expect(notificationPour('LIVREUR', { type: 'STATUT_CHANGE', commande: { ...retrait, statut: 'PRETE' } })).toBeNull()
  })

  it('Vendeur : commande a emporter prete a remettre', () => {
    expect(notificationPour('VENDEUR', { type: 'STATUT_CHANGE', commande: { ...retrait, statut: 'PRETE' } }))
      .toMatchObject({ title: 'Commande #1043 prête', target: '/vente' })
    expect(notificationPour('VENDEUR', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'PRETE' } })).toBeNull()
  })

  it('Gerant et Manager : nouvelles commandes, annulations (remboursement signale), livraisons', () => {
    const annulee = notificationPour('MANAGER', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'ANNULEE', statutPaiement: 'paye' } })
    expect(annulee).toMatchObject({ kind: 'annulee', title: 'Commande #1042 annulée' })
    expect(annulee.text).toContain('remboursement')
    expect(notificationPour('GERANT', { type: 'COMMANDE_PAYEE', commande: { ...retrait, statut: 'PAYEE' } }).text).toContain('Vente comptoir')
    expect(notificationPour('GERANT', { type: 'STATUT_CHANGE', commande: { ...livraison, statut: 'EN_PREPARATION' } })).toBeNull()
  })

  it('cle unique par commande et statut (pas de doublon)', () => {
    const a = notificationPour('CUISINE', { type: 'COMMANDE_PAYEE', commande: { ...livraison, statut: 'PAYEE' } })
    const b = notificationPour('CUISINE', { type: 'COMMANDE_PAYEE', commande: { ...livraison, statut: 'PAYEE' } })
    expect(a.cle).toBe(b.cle)
  })
})

describe('temps ecoule', () => {
  const t0 = new Date('2026-11-13T12:00:00Z').getTime()
  it.each([
    [0, 'À l’instant'],
    [5, 'Il y a 5 min'],
    [125, 'Il y a 2 h'],
    [60 * 30, 'Hier'],
    [60 * 24 * 3, 'Il y a 3 j'],
  ])('%i min -> %s', (min, attendu) => {
    expect(tempsEcoule(new Date(t0 - min * 60000).toISOString(), t0)).toBe(attendu)
  })
})
