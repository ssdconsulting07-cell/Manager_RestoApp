// Accompagnements & condiments (Gerant, 24/10/2026) - fiches independantes
// du catalogue Produits : ce sont les choix proposes a cote d'un produit
// commande (frites, salade, mayonnaise, ketchup...), pas des produits du
// menu. Meme pattern "fiche independante" que Plats du jour (voir
// platsDuJourData.js et brainstorming-chez-ketchup.md). Consommees par
// Vente.jsx (Vendeur) via AccompagnementsCondimentsContext.jsx, pour que
// les fiches creees ici apparaissent immediatement a la caisse.
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

export const TYPES = {
  ACCOMPAGNEMENT: 'ACCOMPAGNEMENT',
  CONDIMENT: 'CONDIMENT',
}

export const TYPE_LABELS = {
  ACCOMPAGNEMENT: 'Accompagnement',
  CONDIMENT: 'Condiment',
}

export function typeIcon(type) {
  return type === TYPES.CONDIMENT ? 'fa-pepper-hot' : 'fa-utensils'
}

export const ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX = [
  {
    id: 'accomp-cond-1',
    nom: "Frites maison",
    prix: 1500,
    type: TYPES.ACCOMPAGNEMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-2',
    nom: "Salade",
    prix: 400,
    type: TYPES.ACCOMPAGNEMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-3',
    nom: "Riz",
    prix: 500,
    type: TYPES.ACCOMPAGNEMENT,
    statut: STATUTS.BROUILLON,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-4',
    nom: "Mayonnaise",
    prix: 0,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-5',
    nom: "Ketchup",
    prix: 0,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-6',
    nom: "Alloco",
    prix: 1000,
    type: TYPES.ACCOMPAGNEMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-7',
    nom: "Attiéké",
    prix: 800,
    type: TYPES.ACCOMPAGNEMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-8',
    nom: "Sauce piquante maison",
    prix: 0,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-9',
    nom: "Sauce oignon (yassa)",
    prix: 200,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-10',
    nom: "Sauce barbecue",
    prix: 200,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ACTIF,
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'accomp-cond-11',
    nom: "Moutarde",
    prix: 0,
    type: TYPES.CONDIMENT,
    statut: STATUTS.ARCHIVE,
    updatedAt: '2026-10-20T09:00:00Z',
  },
]

let nextAccompagnementCondimentId = ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX.length + 1

export function createAccompagnementCondimentId() {
  return `accomp-cond-${nextAccompagnementCondimentId++}`
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
