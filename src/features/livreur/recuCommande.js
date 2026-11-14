// Recu imprime d'une commande en livraison (espace Livreur, Livraisons.jsx) :
// ticket 80 mm detaille, comme un vrai ticket de caisse. Numero, date et
// heure, mode, client et adresse de livraison, chaque article (quantite,
// prix unitaire, total), sous-total, frais de livraison, total, moyen et
// statut du paiement, heure de chaque etape. Montants du serveur (prix figes
// a la commande). Nouvel onglet dedie, CSS isole.
import {
  adresseLivraison,
  positionLivraison,
  clientNomComplet,
  clientTelephone,
  modeLabel,
  noteCommande,
  ticketId,
} from '../cuisine/cuisineUtils.js'
import { etapesHoraires, formatDateHeureComplete, formatMontant, montantsCommande, paiementCommande } from '../cuisine/detailCommande.js'

function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function construireHtmlRecuCommande(commande, produits) {
  const montants = montantsCommande(commande, produits)
  const paiement = paiementCommande(commande)
  const etapes = etapesHoraires(commande)
  const idTicket = ticketId(commande)
  const nom = clientNomComplet(commande)
  const tel = clientTelephone(commande)
  const adresse = adresseLivraison(commande)
  const position = positionLivraison(commande)
  const note = noteCommande(commande)
  const ligne = (libelle, valeur, classe = '') => valeur || valeur === 0
    ? `<div class="row ${classe}"><span>${echapperHtml(libelle)}</span><span>${echapperHtml(valeur)}</span></div>`
    : ''

  const articlesHtml = montants.lignes.map((l) => `
    <li>
      <div class="row article"><span>${l.quantite} &times; ${echapperHtml(l.nom)}</span><span>${echapperHtml(formatMontant(l.total))}</span></div>
      <span class="detail">${l.quantite} &times; ${echapperHtml(formatMontant(l.prixUnitaire))}</span>
      ${l.accompagnement ? `<span class="detail">+ ${echapperHtml(l.accompagnement)}${l.accompagnementPrix ? ` (${echapperHtml(formatMontant(l.accompagnementPrix))})` : ''}</span>` : ''}
      ${l.personnalisation ? `<span class="detail">${echapperHtml(l.personnalisation)}</span>` : ''}
    </li>`).join('')

  const etapesHtml = etapes.length
    ? `<div class="bloc"><p class="titre">Suivi</p>${etapes.map((e) => ligne(e.libelle, e.heure)).join('')}</div>`
    : ''

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Commande n° ${echapperHtml(idTicket)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 80mm; padding: 4mm 3mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #141414; font-size: 12px; }
  h1 { margin: 0; font-size: 18px; text-align: center; letter-spacing: .02em; }
  .sous-titre { margin: 2px 0 0; color: #6b6b6b; font-size: 11px; text-align: center; }
  .ticket { margin: 8px 0 2px; font-size: 22px; font-weight: 800; text-align: center; }
  .meta { margin: 0 0 8px; color: #333; font-size: 11.5px; text-align: center; }
  .bloc { display: flex; flex-direction: column; gap: 3px; padding: 7px 0; border-top: 1px dashed #bbb; }
  .titre { margin: 0 0 2px; color: #a6192e; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .row { display: flex; justify-content: space-between; gap: 10px; }
  .row span:first-child { color: #555; }
  .row span:last-child { text-align: right; font-weight: 600; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .article span:first-child { color: #141414; font-weight: 600; }
  .detail { display: block; color: #6b6b6b; font-size: 10.5px; }
  .total { padding-top: 4px; border-top: 1px solid #141414; font-size: 15px; }
  .total span { color: #141414 !important; font-weight: 800 !important; }
  .note { margin: 0; padding: 6px; border-radius: 4px; background: #f6ecd9; color: #6b4a0c; font-size: 11px; }
  .merci { margin: 10px 0 0; color: #6b6b6b; font-size: 10.5px; font-style: italic; text-align: center; }
</style>
</head>
<body>
  <h1>SenYummies</h1>
  <p class="sous-titre">Chez Ketchup</p>
  <p class="ticket">Ticket n° ${echapperHtml(idTicket)}</p>
  <p class="meta">${echapperHtml(formatDateHeureComplete(commande.creeLe))}<br />${echapperHtml(modeLabel(commande.mode) || '')}</p>

  ${(nom || tel || adresse || position) ? `<div class="bloc"><p class="titre">Client</p>
    ${ligne('Nom', nom)}${ligne('Téléphone', tel)}${ligne('Zone', adresse)}
    ${position ? ligne('GPS', `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`) : ''}
  </div>` : ''}

  <div class="bloc"><p class="titre">Articles (${montants.articles})</p><ul>${articlesHtml}</ul></div>

  <div class="bloc">
    ${ligne('Sous-total', formatMontant(montants.sousTotal))}
    ${montants.frais > 0 ? ligne('Frais de livraison', formatMontant(montants.frais)) : ''}
    ${ligne('Total', formatMontant(montants.total), 'total')}
  </div>

  <div class="bloc"><p class="titre">Paiement</p>
    ${ligne('Moyen', paiement.moyen)}${ligne('Statut', paiement.statut)}
    ${paiement.montantRecu != null ? ligne('Montant reçu', formatMontant(paiement.montantRecu)) : ''}
    ${paiement.monnaieRendue != null ? ligne('Monnaie rendue', formatMontant(paiement.monnaieRendue)) : ''}
  </div>

  ${etapesHtml}
  ${note ? `<div class="bloc"><p class="note">Note du client : ${echapperHtml(note)}</p></div>` : ''}
  <p class="merci">Imprimé le ${echapperHtml(formatDateHeureComplete(new Date().toISOString()))}<br />Merci de votre commande, à bientôt !</p>
</body>
</html>`
}

/** Ouvre un onglet dedie et lance l'impression — meme technique que
 * ouvrirEtImprimerTicket dans Recu.jsx (espace Vendeur) : HTML autonome,
 * aucune dependance au CSS de l'appli, @page isolee de l'onglet principal. */
export function imprimerRecuCommande(commande, produits) {
  const fenetre = window.open('', '_blank', 'width=420,height=640')
  if (!fenetre) return
  fenetre.document.write(construireHtmlRecuCommande(commande, produits))
  fenetre.document.close()
  fenetre.focus()
  fenetre.print()
  fenetre.onafterprint = () => fenetre.close()
}
