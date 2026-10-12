// Commandes du jour — MOCK en memoire en attendant le module Commandes du backend
// (dossier vide, seul le contrat OpenAPI existe). A remplacer par GET /commandes.
//
// ANNULEE n'existe pas encore dans l'enum StatutCommande du contrat : statut
// purement mock, a aligner quand le backend tranchera la gestion des annulations.
export const STATUTS_COMMANDE = {
  PAYEE: 'PAYEE',
  EN_PREPARATION: 'EN_PREPARATION',
  PRETE: 'PRETE',
  LIVREE: 'LIVREE',
  ANNULEE: 'ANNULEE',
}

// Repartition realiste d'un debut d'apres-midi : le gros du service du midi est
// deja livre, quelques commandes arrivent encore.
const REPARTITION = [
  [STATUTS_COMMANDE.LIVREE, 34],
  [STATUTS_COMMANDE.PAYEE, 4],
  [STATUTS_COMMANDE.EN_PREPARATION, 3],
  [STATUTS_COMMANDE.PRETE, 2],
  [STATUTS_COMMANDE.ANNULEE, 3],
]

// Montants de panier plausibles (F CFA), parcourus en boucle.
const MONTANTS = [4500, 7800, 3500, 12400, 6200, 5300, 9600, 3800, 8100, 2500, 15200, 6900, 4200, 7300]

let numero = 437
let index = 0
export const commandesDuJour = REPARTITION.flatMap(([statut, nombre]) => (
  Array.from({ length: nombre }, () => {
    const commande = { id: `commande-${numero}`, numero, statut, montant: MONTANTS[index % MONTANTS.length] }
    numero += 1
    index += 1
    return commande
  })
))

// Une commande annulee n'est pas encaissee : elle sort du CA et du panier moyen.
export function commandesEncaissees(commandes) {
  return commandes.filter((c) => c.statut !== STATUTS_COMMANDE.ANNULEE)
}

export function countByStatutCommande(commandes) {
  const counts = Object.fromEntries(Object.values(STATUTS_COMMANDE).map((statut) => [statut, 0]))
  commandes.forEach((c) => { counts[c.statut] += 1 })
  return counts
}
