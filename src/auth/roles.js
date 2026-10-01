// Roles du staff, identiques a l'enum Role du contrat (backend/contrat-api/openapi.yaml).
export const ROLES = ['CUISINE', 'GERANT', 'MANAGER', 'LIVREUR']

export const ROLE_LABELS = {
  CUISINE: 'Cuisine',
  GERANT: 'Gérant',
  MANAGER: 'Manager',
  LIVREUR: 'Livreur',
}

// Espace d'arrivee de chaque role apres connexion (pas d'ecran de selection manuel).
export const ROLE_HOME = {
  CUISINE: '/dashboard',
  GERANT: '/dashboard',
  MANAGER: '/dashboard',
  LIVREUR: '/dashboard',
}

// Roles autorises par ecran. Le backend reste l'autorite (403 sur chaque appel),
// ce filtrage evite seulement d'afficher un ecran inutilisable.
export const ROUTE_ROLES = {
  '/dashboard': ROLES,
  '/commandes': ['CUISINE'],
  '/preparation': ['CUISINE'],
  '/produits': ['GERANT'],
  '/categories': ['GERANT'],
  '/apercu-client': ['GERANT'],
  '/statistiques': ['MANAGER'],
  // A revoir quand le mode d'attribution des livraisons sera tranche
  // (le Manager pourrait avoir besoin de cet ecran s'il affecte les livreurs).
  '/livraisons': ['LIVREUR'],
  // Non couvert par les specs MVP : a confirmer avec l'equipe Chez Ketchup.
  '/personnel': ['MANAGER'],
}

export function isKnownRole(role) {
  return ROLES.includes(role)
}
