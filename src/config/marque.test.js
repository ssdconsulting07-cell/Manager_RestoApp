import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  delete window.__SENYUMMIES_CONFIG__
  vi.resetModules()
})

const charger = async (config) => {
  if (config) window.__SENYUMMIES_CONFIG__ = config
  return import('./marque.js')
}

describe('marque par defaut', () => {
  it('reste SenYummies (Chez Ketchup), rouge et declinaisons exactes', async () => {
    const { marque, nomEnDeuxTons, signatureTicket } = await charger()
    expect(marque.nom).toBe('SenYummies')
    expect(marque.initiales).toBe('SY')
    expect(marque.couleur).toBe('#A6192E')
    expect(marque.pale).toBe('#FBEAEC')
    expect(marque.bordure).toBe('#E6C2C9')
    expect(marque.vifRgb).toEqual([225, 75, 100])
    expect(nomEnDeuxTons()).toEqual({ debut: 'Sen', accent: 'Yummies' })
    expect(signatureTicket()).toBe('SenYummies · Chez Ketchup')
  })
})

describe('marque d un autre restaurant', () => {
  it('prend nom et couleur, derive les teintes, ticket au nom seul', async () => {
    const { marque, nomEnDeuxTons, signatureTicket } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_COULEUR: '#1F6F57' })
    expect(marque.initiales).toBe('LB')
    expect(marque.couleur).toBe('#1F6F57')
    expect(nomEnDeuxTons()).toEqual({ debut: 'Le Baobab', accent: '' })
    // Pas de "Chez Ketchup" herite de la marque par defaut.
    expect(signatureTicket()).toBe('Le Baobab')
    expect(marque.pale).not.toBe('#FBEAEC')
  })

  it('etablissement distinct sur les tickets', async () => {
    const { signatureTicket } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_ETABLISSEMENT: 'Restaurant Diallo' })
    expect(signatureTicket()).toBe('Le Baobab · Restaurant Diallo')
  })

  it('applique les variables CSS et le titre', async () => {
    const { marque, appliquerMarque } = await charger({ MARQUE_NOM: 'Le Baobab', MARQUE_COULEUR: '#003881' })
    appliquerMarque(marque, document)
    expect(document.documentElement.style.getPropertyValue('--marque')).toBe('#003881')
    expect(document.documentElement.style.getPropertyValue('--marque-rgb')).toBe('0 56 129')
    expect(document.title).toBe('Le Baobab Manager')
  })
})

describe('fiche complete d un restaurant (npm run client)', () => {
  it('par defaut : toutes les photos et tous les moyens de paiement', async () => {
    const { marque, coordonneesTicket } = await charger()
    expect(marque.connexionImages).toEqual([])
    expect(marque.paiements).toEqual(['wave', 'orange-money', 'mixx-yas', 'carte', 'especes'])
    expect(coordonneesTicket()).toBe('')
  })

  it('photos de connexion, caisse filtree et coordonnees des tickets', async () => {
    const { marque, coordonneesTicket } = await charger({
      MARQUE_NOM: 'Kër Saveurs',
      MARQUE_CONNEXION_IMAGES: '/marque/connexion-1.jpg, /marque/connexion-2.jpg',
      MARQUE_PAIEMENTS: 'especes,wave,orange-money',
      MARQUE_ADRESSE: 'Thiès Nord',
      MARQUE_TELEPHONE: '+221330000000',
    })
    expect(marque.connexionImages).toEqual(['/marque/connexion-1.jpg', '/marque/connexion-2.jpg'])
    expect(marque.paiements).toEqual(['wave', 'orange-money', 'especes'])
    expect(coordonneesTicket()).toBe('Thiès Nord · +221330000000')
    const { MODES_PROPOSES, libelleModePaiement } = await import('../features/vendeur/modesPaiement.jsx')
    expect(MODES_PROPOSES.map((m) => m.key)).toEqual(['wave', 'orange-money', 'especes'])
    // Historique : un ancien paiement par carte garde son libelle.
    expect(libelleModePaiement('carte')).toBe('Carte bancaire')
  })

  it('applique la marque : titre de l onglet et couleur', async () => {
    const { marque, appliquerMarque } = await charger({ MARQUE_NOM: 'Kër Saveurs', MARQUE_COULEUR: '#1F7A4D' })
    appliquerMarque(marque, document)
    expect(document.title).toBe('Kër Saveurs Manager')
    expect(document.documentElement.style.getPropertyValue('--marque')).toBe('#1F7A4D')
  })
})
