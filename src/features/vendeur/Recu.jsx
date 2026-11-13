import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { libelleModePaiement } from './modesPaiement.jsx'
import { echapperHtml, formatDateTicket, imprimerTicket } from '../../components/ticket/impressionTicket.js'
import '../../components/ticket/ticket.css'

// Corps HTML du ticket imprime (voir impressionTicket.js : onglet dedie,
// CSS en ligne, @page 80 mm isolee de l'application).
function corpsTicket(vente, vendeurLabel) {
  const lignesHtml = vente.lignes
    .map(
      (ligne) => `
    <li>
      <span>
        ${ligne.quantite}&times; ${echapperHtml(ligne.nom)}
        ${ligne.accompagnementNom ? `<span class="detail">+ ${echapperHtml(ligne.accompagnementNom)}</span>` : ''}
      </span>
      <span>${echapperHtml(formatFCFA(ligne.prix * ligne.quantite))}</span>
    </li>`,
    )
    .join('')
  const especesHtml =
    vente.modePaiement === 'especes'
      ? `
    <div class="row"><span>Montant reçu (espèces)</span><span>${echapperHtml(formatFCFA(vente.montantRecu))}</span></div>
    <div class="row"><span>Monnaie rendue</span><span>${echapperHtml(formatFCFA(vente.monnaieRendue))}</span></div>`
      : ''
  return `
  <p class="eyebrow">Reçu de vente</p>
  <h2>Ticket n° ${echapperHtml(vente.numero)}</h2>
  <p class="meta">${echapperHtml(formatDateTicket(vente.createdAt))} · ${echapperHtml(vendeurLabel)}</p>
  <ul>${lignesHtml}</ul>
  <div class="totaux">
    <div class="row total"><span>Total</span><span>${echapperHtml(formatFCFA(vente.total))}</span></div>
    <div class="row"><span>Mode de paiement</span><span>${echapperHtml(libelleModePaiement(vente.modePaiement))}</span></div>
    ${especesHtml}
  </div>
  <p class="merci">Merci de votre visite — à bientôt chez SenYummies !</p>`
}

// Recu de vente comptoir — reutilise juste apres l'encaissement (Vente.jsx) et
// dans le detail de l'historique (HistoriqueVentes.jsx), pour un seul rendu a
// maintenir. onNouvelleVente n'est fourni que dans le premier cas (juste
// apres l'encaissement) : c'est ce qui distingue "vente fraichement payee" de
// "consultation d'une vente passee". Le bouton "Imprimer" est toujours
// affiche (utile aussi depuis l'historique, pour reimprimer un ticket deja
// encaisse — retour utilisateur) ; il ouvre un nouvel onglet dedie au
// ticket, jamais la page courante. Meme modele visuel que le bon de
// livraison (Cuisine / Livreur, voir BonLivraison.jsx).
export default function Recu({ vente, vendeurLabel, onFermer, onNouvelleVente }) {
  return (
    <div className="ticket">
      <header className="ticket-head">
        <p className="manager-eyebrow">Reçu de vente</p>
        <h2>Ticket n° {vente.numero}</h2>
        <p className="ticket-meta">
          {formatDateTicket(vente.createdAt)} · {vendeurLabel}
        </p>
      </header>

      <ul className="ticket-lignes">
        {vente.lignes.map((ligne, index) => (
          // Deux lignes du meme produit (accompagnements differents) sont
          // possibles depuis le panier : cle par ligneId, avec repli sur
          // l'index pour les ventes seedees qui n'en ont pas.
          <li key={ligne.ligneId ?? `${ligne.produitId}-${index}`}>
            <span>
              {ligne.quantite}× {ligne.nom}
              {ligne.accompagnementNom && <span className="ticket-ligne-detail"> + {ligne.accompagnementNom}</span>}
            </span>
            <span>{formatFCFA(ligne.prix * ligne.quantite)}</span>
          </li>
        ))}
      </ul>

      <div className="ticket-totaux">
        <div className="ticket-total-row is-total">
          <span>Total</span>
          <strong>{formatFCFA(vente.total)}</strong>
        </div>
        <div className="ticket-total-row">
          <span>Mode de paiement</span>
          <span>{libelleModePaiement(vente.modePaiement)}</span>
        </div>
        {vente.modePaiement === 'especes' && (
          <>
            <div className="ticket-total-row">
              <span>Montant reçu (espèces)</span>
              <span>{formatFCFA(vente.montantRecu)}</span>
            </div>
            <div className="ticket-total-row">
              <span>Monnaie rendue</span>
              <span>{formatFCFA(vente.monnaieRendue)}</span>
            </div>
          </>
        )}
      </div>

      <p className="ticket-merci">Merci de votre visite — à bientôt chez SenYummies !</p>

      <div className="ticket-actions">
        {onNouvelleVente && (
          <button type="button" className="manager-button manager-button-primary" onClick={onNouvelleVente}>
            Nouvelle vente
          </button>
        )}
        <button
          type="button"
          className="manager-button manager-button-quiet"
          onClick={() => imprimerTicket(`Ticket n° ${vente.numero}`, corpsTicket(vente, vendeurLabel))}
        >
          Imprimer
        </button>
        {onFermer && (
          <button type="button" className="manager-button manager-button-quiet" onClick={onFermer}>
            Fermer
          </button>
        )}
      </div>
    </div>
  )
}
