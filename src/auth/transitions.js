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
// PRETE -> RETIREE (16/10/2026, audit de coherence des flux) : declenchee
// par le role VENDEUR (la caisse qui remet la commande au client), jamais
// par la Cuisine ni le Livreur — comble le trou signale precedemment ici
// ("role responsable non precise par les specs"). Reservee au mode
// RETRAIT, symetrique de EN_LIVRAISON qui est reservee a LIVRAISON.
//
// PAYEE -> ANNULEE (16/10/2026, meme audit ; restreint le 24/10/2026 a
// PAYEE seule, demande du gerant) : declenchee par la Cuisine, seul role
// avec un ecran sur les commandes actives (/commandes) — pas par le
// Manager, qui n'y a pas acces (voir roles.js). Le statut ANNULEE etait
// jusque-la purement mock (dashboard et journal d'audit Manager, voir
// commandesData.js/auditData.js) sans jamais etre atteignable dans le
// vrai cycle de vie d'une commande. Limitee aux commandes PAS ENCORE
// COMMENCEES (PAYEE) : une fois la preparation entamee (EN_PREPARATION)
// ou le plat pret (PRETE), les ingredients sont deja engages/le plat est
// deja fait — plus de bouton Annuler a ce stade (retour utilisateur du
// 24/10/2026). Toujours pas de transition depuis EN_LIVRAISON : une fois
// partie avec le livreur, trop tard pour annuler depuis cet ecran.
export const TRANSITIONS = [
  { from: 'PAYEE', to: 'EN_PREPARATION', roles: ['CUISINE'], label: 'Commencer la préparation' },
  { from: 'EN_PREPARATION', to: 'PRETE', roles: ['CUISINE'], label: 'Marquer prête' },
  { from: 'PRETE', to: 'EN_LIVRAISON', roles: ['CUISINE'], mode: 'LIVRAISON', label: 'Envoyer au livreur' },
  { from: 'PRETE', to: 'EN_LIVRAISON', roles: ['LIVREUR'], mode: 'LIVRAISON', label: 'Récupéré' },
  { from: 'EN_LIVRAISON', to: 'LIVREE', roles: ['LIVREUR'], mode: 'LIVRAISON', label: 'Marquer livrée' },
  { from: 'PRETE', to: 'RETIREE', roles: ['VENDEUR'], mode: 'RETRAIT', label: 'Remettre au client' },
  { from: 'PAYEE', to: 'ANNULEE', roles: ['CUISINE'], label: 'Annuler' },
]

export const STATUT_LABELS = {
  CREEE: 'Créée',
  PAYEE: 'Reçue',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  EN_LIVRAISON: 'En livraison',
  LIVREE: 'Livrée',
  RETIREE: 'Retirée',
  ANNULEE: 'Annulée',
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
