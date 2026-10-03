import { STATUTS } from './menuData.js'

// Donnees de demonstration — remplacees par l'API /annonces des que ce
// domaine sera disponible cote Backend_RestoApp. Comme pour les produits et
// categories, le cycle Brouillon/Actif/Archive est un concept front pour
// l'instant, a coordonner avec l'equipe Backend avant branchement reel.
//
// Regle metier : une seule annonce peut etre ACTIF a la fois (popup unique a
// l'arrivee sur l'app Client, sur le modele de Max It/Orange Money) — publier
// une annonce depublie automatiquement celle qui l'etait avant (voir
// AnnoncesContext.publierAnnonce).
export const ANNONCES_INITIALES = [
  {
    id: 'annonce-1',
    titre: 'Nouveau : Double Ketchup Burger !',
    message: 'Deux steaks, double cheddar, oignons caramelises. Disponible des maintenant.',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80',
    statut: STATUTS.ACTIF,
    updatedAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'annonce-2',
    titre: 'Horaires spéciaux Tabaski',
    message: 'Le restaurant reste ouvert toute la journée pour la fête.',
    imageUrl: '',
    statut: STATUTS.BROUILLON,
    updatedAt: '2026-09-25T09:00:00Z',
  },
  {
    id: 'annonce-3',
    titre: 'Ancienne offre de lancement',
    message: 'Offre de lancement SenYummies — terminée.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    statut: STATUTS.ARCHIVE,
    updatedAt: '2026-08-15T09:00:00Z',
  },
]

let nextAnnonceId = ANNONCES_INITIALES.length + 1

export function createAnnonceId() {
  return `annonce-${nextAnnonceId++}`
}
