// Pont Vendeur -> Cuisine : convertit une vente encaissee au comptoir (voir
// Vente.jsx) en une vraie commande du cycle de vie partage avec la Cuisine/
// le Livreur (voir transitions.js), au lieu de rester un simple ticket de
// caisse isole (voir ventesData.js) — decision du 16/10/2026 (audit de
// coherence des flux entre les 5 espaces, point 1 : une vente comptoir
// n'entrait jamais en cuisine). canal COMPTOIR + mode RETRAIT : la caisse
// qui a pris la commande est aussi celle qui la remettra au client (voir
// RetraitsComptoir.jsx), jamais un livreur.
import { apiPost } from '../../api/client.js'
import { creerCommandeDemo } from '../cuisine/cuisineDemo.js'

function versLignesCommande(panier) {
  return panier.map((l) => ({
    produitId: l.produitId,
    quantite: l.quantite,
    ...(l.accompagnementNom ? { accompagnementNom: l.accompagnementNom } : {}),
  }))
}

/** Cree la commande cote cuisine pour une vente comptoir. N'echoue jamais
 * (le recu de caisse, lui, est deja emis independamment par enregistrerVente
 * — voir Vente.jsx) : si l'API /commandes ne repond pas encore (package
 * backend vide a ce jour), on retombe sur le meme store demo en memoire que
 * la Cuisine/le Livreur, pour que le ticket apparaisse bien dans leur
 * tableau tant que le vrai backend Commandes n'existe pas. */
export async function creerCommandeComptoir(panier, note) {
  const lignes = versLignesCommande(panier)
  try {
    return await apiPost('/commandes', { canal: 'COMPTOIR', mode: 'RETRAIT', lignes, ...(note ? { note } : {}) })
  } catch {
    return creerCommandeDemo({ lignes, note, canal: 'COMPTOIR', mode: 'RETRAIT' })
  }
}
