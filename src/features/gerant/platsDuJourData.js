// Plats du jour (Gerant, 24/10/2026) - fiches independantes du catalogue
// Produits (pas un produit + badge comme avant, voir brainstorming-
// chez-ketchup.md) : chaque fiche a son propre nom/prix/photo et est
// rattachee a UN jour de la semaine ; plusieurs plats peuvent partager le
// meme jour (cadrage du 24/10/2026). Donnees mock en memoire, consommees
// uniquement par PlatsDuJour.jsx pour l'instant (pas encore branchees sur
// Vente/Cuisine/le site client - hors perimetre de ce chantier).
export const STATUTS = {
  BROUILLON: 'BROUILLON',
  ACTIF: 'ACTIF',
  ARCHIVE: 'ARCHIVE',
}

export const STATUT_LABELS = {
  BROUILLON: 'Brouillon',
  ACTIF: 'Actif',
  ARCHIVE: 'Archivé',
}

export const JOURS_SEMAINE = [
  { id: 'LUNDI', nom: 'Lundi' },
  { id: 'MARDI', nom: 'Mardi' },
  { id: 'MERCREDI', nom: 'Mercredi' },
  { id: 'JEUDI', nom: 'Jeudi' },
  { id: 'VENDREDI', nom: 'Vendredi' },
  { id: 'SAMEDI', nom: 'Samedi' },
  { id: 'DIMANCHE', nom: 'Dimanche' },
]

export function jourLabel(id) {
  return JOURS_SEMAINE.find((jour) => jour.id === id)?.nom || id
}

export const PLATS_DU_JOUR_INITIAUX = [
  {
    id: 'plat-jour-1',
    nom: 'Thiéboudienne',
    description: 'Riz au poisson, légumes mijotés, sauce tomate maison.',
    prix: 3000,
    photoUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    jour: 'LUNDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'plat-jour-2',
    nom: 'Yassa Poulet',
    description: 'Poulet mariné aux oignons et citron, riz blanc.',
    prix: 2800,
    photoUrl: 'https://images.unsplash.com/photo-1598515213692-5f252f3f3d1a?auto=format&fit=crop&w=800&q=80',
    jour: 'MARDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'plat-jour-3',
    nom: 'Mafé Bœuf',
    description: 'Bœuf mijoté à la pâte d’arachide, riz blanc.',
    prix: 3200,
    photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    jour: 'MERCREDI',
    statut: STATUTS.BROUILLON,
    updatedAt: '2026-10-21T09:00:00Z',
  },
]

let nextPlatDuJourId = PLATS_DU_JOUR_INITIAUX.length + 1

export function createPlatDuJourId() {
  return `plat-jour-${nextPlatDuJourId++}`
}

export function countByStatut(items) {
  return items.reduce(
    (acc, item) => {
      acc[item.statut] = (acc[item.statut] || 0) + 1
      return acc
    },
    { BROUILLON: 0, ACTIF: 0, ARCHIVE: 0 },
  )
}
