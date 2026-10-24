// Impression du recu "a rendre au client" pour une commande en livraison —
// demande du 24/10/2026 (espace Livreur, Livraisons.jsx). Different du
// recu de vente comptoir (Recu.jsx, espace Vendeur) : pas de prix/total
// (une commande de la Cuisine/du Livreur n'a jamais porte cette info, voir
// cuisineUtils.js — le client a deja paye via l'app), juste la preuve du
// contenu de la commande et les coordonnees de livraison, dans le meme
// style de ticket 80mm imprimable (nouvel onglet dedie, CSS isole).
import {
  adresseLivraison,
  clientNomComplet,
  clientTelephone,
  nomProduit,
  noteCommande,
  texteAccompagnement,
  textePersonnalisation,
  ticketId,
} from '../cuisine/cuisineUtils.js'

function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateHeure(iso) {
  const date = iso ? new Date(iso) : new Date()
  const jour = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
  return `${jour} à ${heure}`
}

function construireHtmlRecuCommande(commande, produits) {
  const lignes = commande.lignes || []
  const lignesHtml = lignes
    .map((ligne) => {
      const accompagnement = texteAccompagnement(ligne)
      const perso = textePersonnalisation(ligne)
      return `
    <li>
      <strong>${ligne.quantite}&times; ${echapperHtml(nomProduit(produits, ligne.produitId))}</strong>
      ${accompagnement ? `<span class="detail">+ ${echapperHtml(accompagnement)}</span>` : ''}
      ${perso ? `<span class="detail">${echapperHtml(perso)}</span>` : ''}
    </li>`
    })
    .join('')

  const nom = clientNomComplet(commande)
  const tel = clientTelephone(commande)
  const adresse = adresseLivraison(commande)
  const note = noteCommande(commande)
  const idTicket = ticketId(commande)

  const clientHtml = (nom || tel || adresse)
    ? `
  <div class="client">
    ${nom ? `<div class="row"><span>Client</span><span>${echapperHtml(nom)}</span></div>` : ''}
    ${tel ? `<div class="row"><span>Téléphone</span><span>${echapperHtml(tel)}</span></div>` : ''}
    ${adresse ? `<div class="row"><span>Adresse</span><span>${echapperHtml(adresse)}</span></div>` : ''}
  </div>`
    : ''

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Commande n° ${echapperHtml(idTicket)}</title>
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
  .meta { margin: 0 0 12px; color: #6b6b6b; font-size: 12px; text-align: center; }
  .client { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #e5e5e3; }
  .row { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; }
  .row span:first-child { color: #6b6b6b; }
  ul {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  li { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
  .detail { color: #6b6b6b; font-size: 11px; }
  .note { margin: 0 0 10px; padding: 8px; border-radius: 6px; background: #f6ecd9; color: #6b4a0c; font-size: 11.5px; }
  .merci { margin: 0; color: #6b6b6b; font-size: 11px; font-style: italic; text-align: center; }
</style>
</head>
<body>
  <p class="eyebrow">Reçu — commande n° ${echapperHtml(idTicket)}</p>
  <h2>SenYummies</h2>
  <p class="meta">${echapperHtml(formatDateHeure(commande.creeLe))}</p>
  ${clientHtml}
  <ul>${lignesHtml}</ul>
  ${note ? `<p class="note">Note : ${echapperHtml(note)}</p>` : ''}
  <p class="merci">Merci de votre commande — à bientôt chez SenYummies !</p>
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
