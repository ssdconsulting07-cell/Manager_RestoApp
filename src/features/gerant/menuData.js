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

export const DISPONIBILITE = {
  EN_STOCK: 'EN_STOCK',
  RUPTURE: 'RUPTURE',
}

export const DISPONIBILITE_LABELS = {
  EN_STOCK: 'En stock',
  RUPTURE: 'Rupture',
}

// Données de démonstration — remplacées par l'API /produits et /categories
// dès que le domaine Menu sera disponible côté Backend_RestoApp. Le statut
// éditorial (Brouillon / Actif / Archivé) est une notion propre à l'espace
// Gérant : à coordonner avec l'équipe Backend avant la mise en commun réelle.
export const CATEGORIES_INITIALES = [
  { id: 'categorie-1', nom: 'Burgers', statut: STATUTS.ACTIF, updatedAt: '2026-09-20T10:00:00Z' },
  { id: 'categorie-2', nom: 'Accompagnements', statut: STATUTS.ACTIF, updatedAt: '2026-09-20T10:00:00Z' },
  { id: 'categorie-3', nom: 'Boissons', statut: STATUTS.ACTIF, updatedAt: '2026-09-20T10:00:00Z' },
  { id: 'categorie-4', nom: 'Desserts', statut: STATUTS.BROUILLON, updatedAt: '2026-09-28T10:00:00Z' },
]

export const PRODUITS_INITIAUX = [
  {
    id: 'produit-1',
    nom: 'Ketchup Burger Classique',
    description: 'Steak haché, cheddar, sauce maison, pain brioché.',
    prix: 3500,
    categorieId: 'categorie-1',
    photoUrl: '',
    statut: STATUTS.ACTIF,
    disponibilite: DISPONIBILITE.EN_STOCK,
    updatedAt: '2026-09-25T09:00:00Z',
  },
  {
    id: 'produit-2',
    nom: 'Double Ketchup Burger',
    description: 'Deux steaks, double cheddar, oignons caramélisés.',
    prix: 4800,
    categorieId: 'categorie-1',
    photoUrl: '',
    statut: STATUTS.ACTIF,
    disponibilite: DISPONIBILITE.RUPTURE,
    updatedAt: '2026-09-22T09:00:00Z',
  },
  {
    id: 'produit-3',
    nom: 'Frites maison',
    description: 'Frites fraîches coupées sur place, sel fin.',
    prix: 1500,
    categorieId: 'categorie-2',
    photoUrl: '',
    statut: STATUTS.ACTIF,
    disponibilite: DISPONIBILITE.EN_STOCK,
    updatedAt: '2026-09-18T09:00:00Z',
  },
  {
    id: 'produit-4',
    nom: 'Jus de bissap',
    description: 'Bissap frais, peu sucré.',
    prix: 1000,
    categorieId: 'categorie-3',
    photoUrl: '',
    statut: STATUTS.ACTIF,
    disponibilite: DISPONIBILITE.EN_STOCK,
    updatedAt: '2026-09-18T09:00:00Z',
  },
  {
    id: 'produit-5',
    nom: 'Burger Poulet Croustillant',
    description: 'Filet de poulet pané, sauce épicée, salade.',
    prix: 3800,
    categorieId: 'categorie-1',
    photoUrl: '',
    statut: STATUTS.BROUILLON,
    disponibilite: DISPONIBILITE.EN_STOCK,
    updatedAt: '2026-09-30T09:00:00Z',
  },
  {
    id: 'produit-6',
    nom: 'Ketchup Burger Végétarien',
    description: 'Galette de légumes, avocat, sauce maison.',
    prix: 3200,
    categorieId: 'categorie-1',
    photoUrl: '',
    statut: STATUTS.ARCHIVE,
    disponibilite: DISPONIBILITE.RUPTURE,
    updatedAt: '2026-08-10T09:00:00Z',
  },
]

let nextProduitId = PRODUITS_INITIAUX.length + 1
let nextCategorieId = CATEGORIES_INITIALES.length + 1

export function createProduitId() {
  return `produit-${nextProduitId++}`
}

export function createCategorieId() {
  return `categorie-${nextCategorieId++}`
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
