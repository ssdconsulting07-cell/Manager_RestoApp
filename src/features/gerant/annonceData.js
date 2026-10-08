import { STATUTS } from './menuData.js'

// Donnees de demonstration — remplacees par l'API /annonces des que ce
// domaine sera disponible cote Backend_RestoApp. Comme pour les produits et
// categories, le cycle Brouillon/Actif/Archive est un concept front pour
// l'instant, a coordonner avec l'equipe Backend avant branchement reel.
//
// Une chaine publiee peut contenir plusieurs slides. Les chaines actives sont
// presentees successivement cote client, dans l'ordre de publication.
export const CHAINES_INITIALES = [
  {
    id: 'chaine-1',
    titre: 'Nouveautés du menu',
    slides: [{
      id: 'slide-1',
      titre: 'Nouveau : Double Ketchup Burger !',
      message: 'Deux steaks, double cheddar, oignons caramelises. Disponible des maintenant.',
      imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80',
    }],
    statut: STATUTS.ACTIF,
    publishedAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'chaine-2',
    titre: 'Informations pratiques',
    slides: [{
      id: 'slide-2',
      titre: 'Horaires spéciaux Tabaski',
      message: 'Le restaurant reste ouvert toute la journée pour la fête.',
      imageUrl: '',
    }],
    statut: STATUTS.BROUILLON,
    updatedAt: '2026-09-25T09:00:00Z',
  },
  {
    id: 'chaine-3',
    titre: 'Offres terminées',
    slides: [{
      id: 'slide-3',
      titre: 'Ancienne offre de lancement',
      message: 'Offre de lancement SenYummies — terminée.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    }],
    statut: STATUTS.ARCHIVE,
    updatedAt: '2026-08-15T09:00:00Z',
  },
]

let nextChaineId = CHAINES_INITIALES.length + 1
let nextSlideId = CHAINES_INITIALES.reduce((total, chaine) => total + chaine.slides.length, 1)

export function createChaineId() {
  return `chaine-${nextChaineId++}`
}

export function createSlideId() {
  return `slide-${nextSlideId++}`
}
