// Transitions de statut autorisees par role (voir Specs Equipes, section Back-office,
// et PATCH /commandes/{id}/statut dans le contrat). Le backend refuse de toute facon
// une transition interdite (403) : cette table sert a n'afficher que les actions
// que le role connecte a le droit de declencher.
//
// PRETE -> EN_LIVRAISON : tranche (retour utilisateur) — bouton manuel pour
// CUISINE, pas d'auto-affectation. La cuisine garde le controle : le passage
// en "En livraison" n'arrive que quand quelqu'un clique, une fois le
// livreur reellement pret a partir avec la commande (pas de liste de
// livreurs ni d'affectation nominative pour l'instant, juste un
// changement de statut — a revoir si une vraie gestion de livreurs arrive).
// Reserve au mode LIVRAISON (comme EN_LIVRAISON -> LIVREE juste en dessous) :
// un retrait au comptoir n'a pas de livreur a envoyer.
//
// Transition volontairement absente, en attente de decision :
// - PRETE -> RETIREE : role responsable non precise par les specs.
export const TRANSITIONS = [
  { from: 'PAYEE', to: 'EN_PREPARATION', roles: ['CUISINE'], label: 'Commencer la préparation' },
  { from: 'EN_PREPARATION', to: 'PRETE', roles: ['CUISINE'], label: 'Marquer prête' },
  { from: 'PRETE', to: 'EN_LIVRAISON', roles: ['CUISINE'], mode: 'LIVRAISON', label: 'Envoyer au livreur' },
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
