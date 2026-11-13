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
    slides: [
      {
        id: 'slide-1',
        titre: 'Nouveau : les chawarmas sont arrivés !',
        message: 'Poulet ou viande, pain libanais, crudités et sauce maison. À partir de 2 500 F CFA.',
        imageUrl: 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'slide-4',
        titre: 'Le jus de bouye est de retour',
        message: 'Pulpe de baobab, lait et vanille : la douceur du pays, bien fraîche.',
        imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    statut: STATUTS.ACTIF,
    publishedAt: '2026-11-05T09:00:00Z',
    updatedAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 'chaine-4',
    titre: 'Livraison',
    slides: [{
      id: 'slide-5',
      titre: 'On livre jusqu’à Rufisque et Sébikotane',
      message: 'Toute la région de Dakar est couverte. Partagez votre position à la commande : le livreur arrive directement à votre porte.',
      imageUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80',
    }],
    statut: STATUTS.ACTIF,
    publishedAt: '2026-11-08T09:00:00Z',
    updatedAt: '2026-11-08T09:00:00Z',
  },
  {
    id: 'chaine-5',
    titre: 'Offre du week-end',
    slides: [{
      id: 'slide-6',
      titre: 'Un dessert offert dès 10 000 F CFA',
      message: 'Samedi et dimanche, un thiakry ou un beignet offert pour toute commande de 10 000 F CFA et plus.',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
    }],
    statut: STATUTS.ACTIF,
    publishedAt: '2026-11-10T09:00:00Z',
    updatedAt: '2026-11-10T09:00:00Z',
  },
  {
    id: 'chaine-2',
    titre: 'Informations pratiques',
    slides: [{
      id: 'slide-2',
      titre: 'Horaires spéciaux Tabaski',
      message: 'Le restaurant reste ouvert toute la journée pour la fête.',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
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
