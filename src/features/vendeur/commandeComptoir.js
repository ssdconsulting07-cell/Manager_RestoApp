// Vente au comptoir = une commande du cycle de vie partage avec la Cuisine
// (canal COMPTOIR, mode RETRAIT) : la caisse qui l'a prise la remettra au
// client (RetraitsComptoir.jsx). Decision du 16/10/2026.
//
// Le SERVEUR fait foi : il recalcule le total, controle le montant recu en
// especes (400 MONTANT_INSUFFISANT sinon) et calcule la monnaie a rendre. Le
// ticket imprime reprend ses chiffres et son numero.
//
// cle (en-tete Idempotency-Key) : la meme cle est renvoyee si l'encaissement
// est retente apres une coupure ; le serveur rejoue alors la premiere vente
// au lieu d'en creer une deuxieme.
import { apiPostAvecEntetes } from '../../api/client.js'
import { creerCommandeDemo } from '../cuisine/cuisineDemo.js'

function versLignesCommande(panier) {
  return panier.map((l) => ({
    produitId: l.produitId,
    quantite: l.quantite,
    ...(l.accompagnementId ? { accompagnementId: l.accompagnementId } : {}),
    ...(l.accompagnementNom ? { accompagnementNom: l.accompagnementNom } : {}),
  }))
}

export function nouvelleCleVente() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `vente-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function creerCommandeComptoir(panier, { moyenPaiement = 'especes', montantRecu, cle, note } = {}) {
  const lignes = versLignesCommande(panier)
  const corps = {
    canal: 'COMPTOIR',
    mode: 'RETRAIT',
    moyenPaiement,
    ...(moyenPaiement === 'especes' ? { montantRecu } : {}),
    lignes,
    ...(note ? { note } : {}),
  }
  try {
    return await apiPostAvecEntetes('/commandes', corps, cle ? { 'Idempotency-Key': cle } : {})
  } catch (err) {
    // Developpement sans backend (aucune reponse du serveur) : store de
    // demonstration partage avec la Cuisine. Jamais en production, ou une
    // vente non enregistree doit rester visible comme telle au Vendeur.
    if (import.meta.env.DEV && !err.status) return creerCommandeDemo({ lignes, note, canal: 'COMPTOIR', mode: 'RETRAIT' })
    throw err
  }
}
