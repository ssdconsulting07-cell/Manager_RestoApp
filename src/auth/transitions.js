// Transitions de statut autorisees par role (voir Specs Equipes, section Back-office,
// et PATCH /commandes/{id}/statut dans le contrat). Le backend refuse de toute facon
// une transition interdite (403) : cette table sert a n'afficher que les actions
// que le role connecte a le droit de declencher.
//
// PRETE -> EN_LIVRAISON : declenchable des DEUX cotes (retour utilisateur,
// 16/10/2026) — soit la Cuisine envoie ("Envoyer au livreur"), soit le
// Livreur confirme avoir recupere la commande sur place ("Récupéré"),
// selon qui agit en premier dans la realite. Deux entrees separees (meme
// from/to/mode, roles et label differents) plutot qu'un label partage, pour
// que chaque ecran affiche le bon intitule sans avoir a connaitre le role
// de l'autre cote — voir CommandeRow.jsx pour la confirmation elle aussi
// adaptee par role. Toujours pas d'auto-affectation ni de liste de
// livreurs nominative, juste un changement de statut manuel d'un cote ou
// de l'autre — a revoir si une vraie gestion de livreurs arrive.
// Reservees au mode LIVRAISON (comme EN_LIVRAISON -> LIVREE juste en
// dessous) : un retrait au comptoir n'a pas de livreur a envoyer/recuperer.
//
// Transition volontairement absente, en attente de decision :
// - PRETE -> RETIREE : role responsable non precise par les specs.
export const TRANSITIONS = [
  { from: 'PAYEE', to: 'EN_PREPARATION', roles: ['CUISINE'], label: 'Commencer la préparation' },
  { from: 'EN_PREPARATION', to: 'PRETE', roles: ['CUISINE'], label: 'Marquer prête' },
  { from: 'PRETE', to: 'EN_LIVRAISON', roles: ['CUISINE'], mode: 'LIVRAISON', label: 'Envoyer au livreur' },
  { from: 'PRETE', to: 'EN_LIVRAISON', roles: ['LIVREUR'], mode: 'LIVRAISON', label: 'Récupéré' },
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
