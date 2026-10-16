import { useAuth } from '../../auth/AuthContext.jsx'
import { allowedTransitions } from '../../auth/transitions.js'
import CommandeRow from '../cuisine/CommandeRow.jsx'
import '../cuisine/cuisine-board.css'
import { useRetraitsComptoir } from './useRetraitsComptoir.js'

/** Panneau « Prêtes à remettre » affiché au-dessus du catalogue (voir
 * Vente.jsx) : les ventes comptoir (commandeComptoir.js) que la Cuisine a
 * marquées prêtes, en attente que la caisse les remette au client
 * (transition PRETE -> RETIREE, décision du 16/10/2026). Réutilise
 * CommandeRow (déjà partagé Cuisine/Livreur) pour rester visuellement
 * identique au même ticket vu côté Cuisine, plutôt que de réinventer un
 * composant de ticket pour ce 3e écran. Masqué entièrement quand il n'y a
 * rien à remettre, pour ne pas encombrer la caisse en service normal. */
export default function RetraitsComptoir() {
  const { role } = useAuth()
  const { commandes, produits, pendingId, remettreAuClient } = useRetraitsComptoir()

  if (commandes.length === 0) return null

  return (
    <section className="vendeur-retraits-panel" aria-label="Commandes prêtes à remettre au comptoir">
      <p className="vendeur-retraits-titre">
        <i className="fa-solid fa-bell-concierge" aria-hidden="true" /> Prêtes à remettre ({commandes.length})
      </p>
      <div className="crud-list">
        {commandes.map((commande) => (
          <CommandeRow
            key={commande.id}
            commande={commande}
            produits={produits}
            showDuree
            transitions={allowedTransitions(commande, role)}
            pending={pendingId === commande.id}
            onTransition={() => remettreAuClient(commande)}
          />
        ))}
      </div>
    </section>
  )
}
