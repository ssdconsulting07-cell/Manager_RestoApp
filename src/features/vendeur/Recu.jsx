import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

function formatHeure(iso) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

// Recu de vente comptoir — reutilise juste apres l'encaissement (Vente.jsx) et
// dans le detail de l'historique (HistoriqueVentes.jsx), pour un seul rendu a
// maintenir.
export default function Recu({ vente, vendeurLabel, onFermer, onNouvelleVente }) {
  return (
    <div className="vendeur-recu">
      <header className="vendeur-recu-head">
        <p className="manager-eyebrow">Reçu de vente</p>
        <h2>Ticket n° {vente.numero}</h2>
        <p className="vendeur-recu-meta">
          {formatDate(vente.createdAt)} à {formatHeure(vente.createdAt)} · {vendeurLabel}
        </p>
      </header>

      <ul className="vendeur-recu-lignes">
        {vente.lignes.map((ligne) => (
          <li key={ligne.produitId}>
            <span className="vendeur-recu-ligne-nom">
              {ligne.quantite}× {ligne.nom}
              {ligne.accompagnementNom && (
                <span className="vendeur-recu-ligne-accomp"> + {ligne.accompagnementNom}</span>
              )}
            </span>
            <span className="vendeur-recu-ligne-prix">{formatFCFA(ligne.prix * ligne.quantite)}</span>
          </li>
        ))}
      </ul>

      <div className="vendeur-recu-totaux">
        <div className="vendeur-recu-total-row is-total">
          <span>Total</span>
          <strong>{formatFCFA(vente.total)}</strong>
        </div>
        <div className="vendeur-recu-total-row">
          <span>Montant reçu (espèces)</span>
          <span>{formatFCFA(vente.montantRecu)}</span>
        </div>
        <div className="vendeur-recu-total-row">
          <span>Monnaie rendue</span>
          <span>{formatFCFA(vente.monnaieRendue)}</span>
        </div>
      </div>

      <div className="vendeur-recu-actions">
        {onNouvelleVente && (
          <button type="button" className="manager-button manager-button-primary" onClick={onNouvelleVente}>
            Nouvelle vente
          </button>
        )}
        {onNouvelleVente && (
          <button type="button" className="manager-button manager-button-quiet" onClick={() => window.print()}>
            Imprimer
          </button>
        )}
        {onFermer && (
          <button type="button" className="manager-button manager-button-quiet" onClick={onFermer}>
            Fermer
          </button>
        )}
      </div>
    </div>
  )
}
