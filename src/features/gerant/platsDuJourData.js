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
    nom: "Thiéboudienne",
    description: "Riz rouge au poisson, légumes mijotés, sauce tomate maison.",
    prix: 3000,
    photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    jour: 'LUNDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'plat-jour-2',
    nom: "Yassa poisson",
    description: "Poisson mariné au citron et aux oignons confits, riz blanc.",
    prix: 3000,
    photoUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    jour: 'MARDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'plat-jour-3',
    nom: "Mafé bœuf",
    description: "Bœuf mijoté à la pâte d’arachide, riz blanc.",
    prix: 3200,
    photoUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    jour: 'MERCREDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-21T09:00:00Z',
  },
  {
    id: 'plat-jour-4',
    nom: "Soupou kandia",
    description: "Sauce gombo à l’huile de palme, poisson et fruits de mer, riz.",
    prix: 3200,
    photoUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80',
    jour: 'JEUDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'plat-jour-5',
    nom: "Thiou poulet",
    description: "Poulet en sauce tomate et légumes, riz blanc.",
    prix: 2800,
    photoUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    jour: 'JEUDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'plat-jour-6',
    nom: "Poisson braisé",
    description: "Poisson entier grillé, oignons, sauce piquante, frites ou attiéké.",
    prix: 3500,
    photoUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    jour: 'VENDREDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'plat-jour-7',
    nom: "Thiébou yapp",
    description: "Riz à la viande de bœuf, oignons et épices.",
    prix: 3000,
    photoUrl: '',
    jour: 'VENDREDI',
    statut: STATUTS.BROUILLON,
    updatedAt: '2026-11-10T09:00:00Z',
  },
  {
    id: 'plat-jour-8',
    nom: "Dibi agneau",
    description: "Agneau grillé au feu de bois, oignons, moutarde, pain.",
    prix: 4000,
    photoUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
    jour: 'SAMEDI',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'plat-jour-9',
    nom: "Poulet braisé frites",
    description: "Demi-poulet braisé, frites maison, salade.",
    prix: 3500,
    photoUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    jour: 'DIMANCHE',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-11-03T09:00:00Z',
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
