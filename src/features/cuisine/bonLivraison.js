// Bon de livraison / ticket de commande — meme modele visuel que le recu de
// vente du Vendeur (voir components/ticket). Imprime par la Cuisine (a
// agrafer sur le sac) ou par le Livreur (a remettre au client) : contenu de
// la commande, prix, paiement, coordonnees du client, zone, note, et un QR
// code d'itineraire que le livreur scanne pour ouvrir le GPS.
import QRCode from 'qrcode'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { echapperHtml, formatDateTicket } from '../../components/ticket/impressionTicket.js'
import { libelleModePaiement } from '../vendeur/modesPaiement.jsx'
import {
  adresseLivraison,
  clientNomComplet,
  clientTelephone,
  lienItineraire,
  nomProduit,
  noteCommande,
  positionLivraison,
  texteAccompagnement,
  textePersonnalisation,
  ticketId,
} from './cuisineUtils.js'

// Prix unitaire d'une ligne : fige sur la ligne (commande App Client), sinon
// prix du catalogue (comptoir / demo). Null si inconnu.
function prixLigne(ligne, produits) {
  if (Number.isFinite(ligne.prixUnitaire)) return ligne.prixUnitaire
  const base = produits?.[ligne.produitId]?.prix
  if (!Number.isFinite(base)) return null
  return base + (Number.isFinite(ligne.accompagnementPrix) ? ligne.accompagnementPrix : 0)
}

export function modeleBonLivraison(commande, produits) {
  const livraison = commande.mode === 'LIVRAISON'
  const lignes = (commande.lignes || []).map((l) => {
    const pu = prixLigne(l, produits)
    return {
      texte: `${l.quantite}× ${nomProduit(produits, l)}`,
      details: [texteAccompagnement(l) && `+ ${texteAccompagnement(l)}`, textePersonnalisation(l)].filter(Boolean),
      montant: pu === null ? null : pu * l.quantite,
    }
  })
  const prixConnus = lignes.every((l) => l.montant !== null)
  const sousTotal = Number.isFinite(commande.sousTotal)
    ? commande.sousTotal
    : prixConnus
      ? lignes.reduce((t, l) => t + l.montant, 0)
      : null
  const frais = livraison && Number.isFinite(commande.fraisLivraison) ? commande.fraisLivraison : 0
  const total = Number.isFinite(commande.total) ? commande.total : sousTotal === null ? null : sousTotal + frais
  const position = positionLivraison(commande)

  return {
    idTicket: ticketId(commande),
    eyebrow: livraison ? 'Bon de livraison' : 'Ticket de commande',
    meta: `${formatDateTicket(commande.creeLe)} · ${commande.canal === 'COMPTOIR' ? 'Comptoir' : 'Commande App'}`,
    client: [
      ['Client', clientNomComplet(commande)],
      ['Téléphone', clientTelephone(commande)],
      ['Zone', livraison ? adresseLivraison(commande) : 'Retrait au comptoir'],
    ].filter(([, v]) => v),
    note: noteCommande(commande),
    lignes,
    prixConnus,
    sousTotal,
    frais,
    total,
    paiement: commande.moyenPaiement ? libelleModePaiement(commande.moyenPaiement) : null,
    paye: commande.statutPaiement === 'paye' || commande.canal === 'APP' || commande.statut !== 'CREEE',
    itineraire: livraison ? lienItineraire(position) : null,
  }
}

export function qrItineraireSvg(url) {
  return QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
}

// Corps HTML imprime (meme structure que le recu de vente, voir Recu.jsx).
export async function corpsBonLivraison(commande, produits) {
  const m = modeleBonLivraison(commande, produits)
  const e = echapperHtml
  const qr = m.itineraire ? await qrItineraireSvg(m.itineraire) : null
  return `
  <p class="eyebrow">${e(m.eyebrow)}</p>
  <h2>Ticket n° ${e(m.idTicket)}</h2>
  <p class="meta">${e(m.meta)}</p>
  ${m.client.length ? `<div class="bloc"><p class="bloc-titre">Client</p>${m.client.map(([k, v]) => `<div class="info"><span>${e(k)}</span><span>${e(v)}</span></div>`).join('')}${m.note ? `<p class="note">Note : ${e(m.note)}</p>` : ''}</div>` : ''}
  <ul>${m.lignes
    .map(
      (l) =>
        `<li><span>${e(l.texte)}${l.details.map((d) => `<span class="detail">${e(d)}</span>`).join('')}</span>${m.prixConnus ? `<span>${e(formatFCFA(l.montant))}</span>` : ''}</li>`,
    )
    .join('')}</ul>
  <div class="totaux">
    ${m.prixConnus && m.frais ? `<div class="row"><span>Sous-total</span><span>${e(formatFCFA(m.sousTotal))}</span></div><div class="row"><span>Livraison</span><span>${e(formatFCFA(m.frais))}</span></div>` : ''}
    ${m.total !== null && m.prixConnus ? `<div class="row total"><span>Total</span><span>${e(formatFCFA(m.total))}</span></div>` : ''}
    ${m.paiement ? `<div class="row"><span>Paiement</span><span>${e(m.paiement)}${m.paye ? ' · <span class="paye">Payé</span>' : ''}</span></div>` : ''}
  </div>
  ${qr ? `<div class="qr">${qr}<p>Scanner pour l’itinéraire GPS</p></div>` : ''}
  <p class="merci">Merci de votre commande — à bientôt chez SenYummies !</p>`
}
