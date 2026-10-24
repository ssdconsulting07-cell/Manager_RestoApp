// Prix de livraison par region active puis par arrondissement - MOCK en
// memoire pour la session en cours, meme logique que les autres modules
// mock de ce projet (commandesData.js, auditData.js, ventesData.js) :
// aucun backend "zones de livraison" n'existe encore (voir
// brainstorming-chez-ketchup.md). Dakar est pre-activee (siege du
// restaurant Chez Ketchup) ; les autres regions sont activables depuis la
// carte (voir CarteSenegal.jsx / ZonesLivraison.jsx) - plusieurs regions
// actives en parallele sont possibles (cadrage du 24/10/2026).
import { ARRONDISSEMENTS_PAR_REGION } from './senegalZones.js'

export const PRIX_PAR_DEFAUT = 1000

function prixParDefautPourRegion(codeRegion) {
  const prix = {}
  for (const arrondissement of ARRONDISSEMENTS_PAR_REGION[codeRegion] || []) {
    prix[arrondissement.nom] = PRIX_PAR_DEFAUT
  }
  return prix
}

export const zonesLivraison = {
  DAKAR: {
    Almadies: 1000,
    'Grand Dakar': 1000,
    'Parcelles Assainies': 1500,
    'Plateau/Gorée': 2000,
    Guédiawaye: 1500,
    'Keur Massar': 1500,
    Dagoudane: 1500,
    Niayes: 2000,
    Thiaroye: 1500,
    Rufisque: 2500,
    Sébikotane: 3000,
  },
}

export function estActive(codeRegion) {
  return Boolean(zonesLivraison[codeRegion])
}

// Reinitialise le mock a son etat initial (Dakar seule, prix de depart) -
// usage tests uniquement, pour ne pas laisser une activation/desactivation
// d'un test fuiter sur le suivant (module partage, voir note en tete de
// fichier).
const DAKAR_PAR_DEFAUT = { ...zonesLivraison.DAKAR }

export function reinitialiserPourTests() {
  for (const code of Object.keys(zonesLivraison)) delete zonesLivraison[code]
  zonesLivraison.DAKAR = { ...DAKAR_PAR_DEFAUT }
}

export function regionsActives() {
  return Object.keys(zonesLivraison)
}

export function activerRegion(codeRegion) {
  if (!zonesLivraison[codeRegion]) {
    zonesLivraison[codeRegion] = prixParDefautPourRegion(codeRegion)
  }
  return zonesLivraison[codeRegion]
}

export function desactiverRegion(codeRegion) {
  delete zonesLivraison[codeRegion]
}

export function definirPrix(codeRegion, nomArrondissement, prix) {
  if (!zonesLivraison[codeRegion]) zonesLivraison[codeRegion] = {}
  zonesLivraison[codeRegion][nomArrondissement] = prix
}

export function prixDe(codeRegion) {
  return zonesLivraison[codeRegion] || {}
}
