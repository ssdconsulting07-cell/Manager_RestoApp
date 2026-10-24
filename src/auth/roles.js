// Roles du staff, identiques a l'enum Role du contrat (backend/contrat-api/openapi.yaml).
// VENDEUR (espace Vendeur/Caissier, V2) est desormais un role backend a part
// entiere (compte seed "vendeur", voir StaffUserSeed cote Backend_RestoApp),
// au meme titre que les autres.
export const ROLES = ['CUISINE', 'GERANT', 'MANAGER', 'LIVREUR', 'VENDEUR']

export const ROLE_LABELS = {
  CUISINE: 'Cuisine',
  GERANT: 'Gérant',
  MANAGER: 'Manager',
  LIVREUR: 'Livreur',
  VENDEUR: 'Vendeur',
}

// Espace d'arrivee de chaque role apres connexion (pas d'ecran de selection manuel).
export const ROLE_HOME = {
  CUISINE: '/dashboard',
  GERANT: '/dashboard',
  MANAGER: '/dashboard',
  LIVREUR: '/dashboard',
  VENDEUR: '/dashboard',
}

// Roles autorises par ecran. Le backend reste l'autorite (403 sur chaque appel),
// ce filtrage evite seulement d'afficher un ecran inutilisable.
export const ROUTE_ROLES = {
  '/dashboard': ROLES,
  '/commandes': ['CUISINE'],
  '/produits': ['GERANT'],
  '/categories': ['GERANT'],
  '/annonces': ['GERANT'],
  // Une sous-page par role (voir Layout.jsx : dropdown sidebar) - le
  // Manager lui-meme n'a jamais sa propre page ici (voir auditData.js).
  // Les deux entrees sont necessaires (meme liste de roles) : la premiere
  // pour le lien nu /journal-audit (App.jsx, route de redirection vers la
  // sous-page Cuisine - protegee elle aussi, pour que le "from" de
  // ProtectedRoute/Connexion.jsx reste exploitable apres connexion), la
  // seconde pour la sous-page elle-meme.
  '/journal-audit': ['MANAGER'],
  '/journal-audit/:roleSlug': ['MANAGER'],
  // A revoir quand le mode d'attribution des livraisons sera tranche
  // (le Manager pourrait avoir besoin de cet ecran s'il affecte les livreurs).
  '/livraisons': ['LIVREUR'],
  '/historique-livraisons': ['LIVREUR'],
  // Non couvert par les specs MVP : a confirmer avec l'equipe Chez Ketchup.
  '/personnel': ['GERANT'],
  // Gestion des comptes Gerant + vue lecture seule sur les autres employes
  // (24/10/2026, voir brainstorming-chez-ketchup.md) : desormais seul le
  // Manager gere les comptes Gerant, le Gerant ne gerant plus que
  // Cuisine/Livreur/Vendeur sur sa propre page /personnel ci-dessus.
  '/equipe': ['MANAGER'],
  // Carte des 14 regions + prix de livraison par arrondissement (mock
  // front uniquement, 24/10/2026).
  '/zones-livraison': ['GERANT'],
  '/vente': ['VENDEUR'],
  '/historique-ventes': ['VENDEUR'],
}

export function isKnownRole(role) {
  return ROLES.includes(role)
}
