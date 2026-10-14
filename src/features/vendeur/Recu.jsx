import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { libelleModePaiement } from './modesPaiement.jsx'

function formatHeure(iso) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Construit un document HTML autonome pour le ticket (aucune dependance au
// CSS de l'appli) : utilise par ouvrirEtImprimerTicket pour un nouvel
// onglet dedie a l'impression. Garde la regle @page (format 80mm) isolee
// de l'onglet principal — une impression lancee ailleurs dans l'appli
// n'est plus affectee (retour utilisateur sur la portee trop globale de
// cette regle quand elle vivait dans vendeur-pos.css).
function construireHtmlTicket(vente, vendeurLabel) {
  const lignesHtml = vente.lignes
    .map(
      (ligne) => `
    <li>
      <span>
        ${ligne.quantite}&times; ${echapperHtml(ligne.nom)}
        ${ligne.accompagnementNom ? `<span class="accomp"> + ${echapperHtml(ligne.accompagnementNom)}</span>` : ''}
      </span>
      <span>${echapperHtml(formatFCFA(ligne.prix * ligne.quantite))}</span>
    </li>`,
    )
    .join('')

  const especesHtml =
    vente.modePaiement === 'especes'
      ? `
    <div class="row">
      <span>Montant reçu (espèces)</span>
      <span>${echapperHtml(formatFCFA(vente.montantRecu))}</span>
    </div>
    <div class="row">
      <span>Monnaie rendue</span>
      <span>${echapperHtml(formatFCFA(vente.monnaieRendue))}</span>
    </div>`
      : ''

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Ticket n° ${echapperHtml(vente.numero)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 80mm;
    padding: 4mm 3mm;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    color: #141414;
  }
  .eyebrow {
    margin: 0;
    color: #a6192e;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: center;
  }
  h2 { margin: 4px 0; font-size: 18px; text-align: center; }
  .meta { margin: 0 0 14px; color: #6b6b6b; font-size: 12px; text-align: center; }
  ul {
    list-style: none;
    margin: 0 0 14px;
    padding: 12px 0;
    border-top: 1px dashed #e5e5e3;
    border-bottom: 1px dashed #e5e5e3;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  li { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
  .accomp { display: block; color: #6b6b6b; font-size: 11px; }
  .totaux { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; font-size: 13px; color: #6b6b6b; }
  .row.total { color: #141414; font-size: 16px; font-weight: 700; }
  .merci { margin: 0; color: #6b6b6b; font-size: 11px; font-style: italic; text-align: center; }
</style>
</head>
<body>
  <p class="eyebrow">Reçu de vente</p>
  <h2>Ticket n° ${echapperHtml(vente.numero)}</h2>
  <p class="meta">${echapperHtml(formatDate(vente.createdAt))} à ${echapperHtml(formatHeure(vente.createdAt))} · ${echapperHtml(vendeurLabel)}</p>
  <ul>${lignesHtml}</ul>
  <div class="totaux">
    <div class="row total">
      <span>Total</span>
      <span>${echapperHtml(formatFCFA(vente.total))}</span>
    </div>
    <div class="row">
      <span>Mode de paiement</span>
      <span>${echapperHtml(libelleModePaiement(vente.modePaiement))}</span>
    </div>
    ${especesHtml}
  </div>
  <p class="merci">Merci de votre visite — à bientôt chez SenYummies !</p>
</body>
</html>`
}

// Ouvre le ticket dans un nouvel onglet dedie, hors de la page Vente — le
// seul contenu de cet onglet est le ticket lui-meme (pas de sidebar/header
// a masquer via CSS), et sa regle @page (80mm) reste isolee de l'onglet
// principal. document.write/close est synchrone et tout le CSS est en
// ligne (pas de feuille externe a charger), donc print() peut suivre sans
// attendre un evenement de chargement.
function ouvrirEtImprimerTicket(vente, vendeurLabel) {
  const fenetre = window.open('', '_blank', 'width=420,height=640')
  if (!fenetre) return
  fenetre.document.write(construireHtmlTicket(vente, vendeurLabel))
  fenetre.document.close()
  fenetre.focus()
  fenetre.print()
  fenetre.onafterprint = () => fenetre.close()
}

// Recu de vente comptoir — reutilise juste apres l'encaissement (Vente.jsx) et
// dans le detail de l'historique (HistoriqueVentes.jsx), pour un seul rendu a
// maintenir. onNouvelleVente n'est fourni que dans le premier cas (juste
// apres l'encaissement) : c'est ce qui distingue "vente fraichement payee" de
// "consultation d'une vente passee". Le bouton "Imprimer" est toujours
// affiche (utile aussi depuis l'historique, pour reimprimer un ticket deja
// encaisse — retour utilisateur) ; il ouvre un nouvel onglet dedie au
// ticket, jamais la page courante.
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
        {vente.lignes.map((ligne, index) => (
          // Deux lignes du meme produit (accompagnements differents) sont
          // possibles depuis le panier : cle par ligneId, avec repli sur
          // l'index pour les ventes seedees qui n'en ont pas.
          <li key={ligne.ligneId ?? `${ligne.produitId}-${index}`}>
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
          <span>Mode de paiement</span>
          <span>{libelleModePaiement(vente.modePaiement)}</span>
        </div>
        {vente.modePaiement === 'especes' && (
          <>
            <div className="vendeur-recu-total-row">
              <span>Montant reçu (espèces)</span>
              <span>{formatFCFA(vente.montantRecu)}</span>
            </div>
            <div className="vendeur-recu-total-row">
              <span>Monnaie rendue</span>
              <span>{formatFCFA(vente.monnaieRendue)}</span>
            </div>
          </>
        )}
      </div>

      <p className="vendeur-recu-merci">Merci de votre visite — à bientôt chez SenYummies !</p>

      <div className="vendeur-recu-actions">
        {onNouvelleVente && (
          <button type="button" className="manager-button manager-button-primary" onClick={onNouvelleVente}>
            Nouvelle vente
          </button>
        )}
        <button
          type="button"
          className="manager-button manager-button-quiet"
          onClick={() => ouvrirEtImprimerTicket(vente, vendeurLabel)}
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
