// Transitions de statut autorisees par role (voir Specs Equipes, section Back-office,
// et PATCH /commandes/{id}/statut dans le contrat). Le backend refuse de toute facon
// une transition interdite (403) : cette table sert a n'afficher que les actions
// que le role connecte a le droit de declencher.
//
// Transitions volontairement absentes, en attente de decision :
// - PRETE -> EN_LIVRAISON : depend du mode d'attribution d'une commande a un livreur
//   (manuelle par le Manager ou auto-affectation), pas encore tranche.
// - PRETE -> RETIREE : role responsable non precise par les specs.
export const TRANSITIONS = [
  { from: 'PAYEE', to: 'EN_PREPARATION', roles: ['CUISINE'], label: 'Commencer la préparation' },
  { from: 'EN_PREPARATION', to: 'PRETE', roles: ['CUISINE'], label: 'Marquer prête' },
  { from: 'EN_LIVRAISON', to: 'LIVREE', roles: ['LIVREUR'], mode: 'LIVRAISON', label: 'Marquer livrée' },
]

export const STATUT_LABELS = {
  CREEE: 'Créée',
  PAYEE: 'Reçue',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  EN_LIVRAISON: 'En livraison',
  LIVREE: 'Livrée',
  RETIREE: 'Retirée',
}

// Transitions que `role` peut appliquer a `commande` dans son etat actuel.
export function allowedTransitions(commande, role) {
  return TRANSITIONS.filter(
    (t) =>
      t.from === commande.statut &&
      t.roles.includes(role) &&
      (!t.mode || t.mode === commande.mode),
  )
}

export function canTransition(commande, to, role) {
  return allowedTransitions(commande, role).some((t) => t.to === to)
}
