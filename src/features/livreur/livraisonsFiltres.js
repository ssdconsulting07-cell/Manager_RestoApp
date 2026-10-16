// Filtres de l'Historique des livraisons (espace Livreur), partages par la
// liste a l'ecran et l'export : l'export reprend exactement la recherche
// active, bornee par une periode (meme structure que
// journalAuditFiltres.js, cote Manager, mais sans filtre role/domaine —
// l'historique du livreur ne concerne qu'un seul acteur).
import { canalLabel, modeLabel, nomProduit, noteCommande, ticketId } from '../cuisine/cuisineUtils.js'

// Recherche insensible a la casse et aux accents (« prete » trouve « prête »).
function normaliser(texte) {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filtrerLivraisons(livrees, produits, { recherche = '' }) {
  const termes = normaliser(recherche.trim()).split(/\s+/).filter(Boolean)
  if (!termes.length) return livrees
  return livrees.filter((commande) => {
    const texte = normaliser([
      ticketId(commande),
      canalLabel(commande),
      modeLabel(commande.mode),
      noteCommande(commande) || '',
      ...(commande.lignes || []).map((ligne) => nomProduit(produits, ligne.produitId)),
    ].join(' '))
    return termes.every((terme) => texte.includes(terme))
  })
}

// Dates au format des champs <input type="date"> (AAAA-MM-JJ), en heure locale.
function debutDuJour(valeur) {
  const [a, m, j] = valeur.split('-').map(Number)
  return new Date(a, m - 1, j, 0, 0, 0, 0)
}

function finDuJour(valeur) {
  const [a, m, j] = valeur.split('-').map(Number)
  return new Date(a, m - 1, j, 23, 59, 59, 999)
}

export function erreurPeriode({ debut, fin }) {
  if (debut && fin && fin < debut) return 'La date de fin doit être postérieure ou égale à la date de début.'
  return null
}

// Bornes incluses : la date de fin couvre toute la journee. Filtre sur la
// date de livraison (livreeLe) plutot que la date de creation (creeLe) —
// c'est bien l'historique des livraisons, pas des commandes.
export function filtrerParPeriode(livrees, { debut, fin }) {
  const min = debut ? debutDuJour(debut) : null
  const max = fin ? finDuJour(fin) : null
  return livrees.filter((commande) => {
    const date = new Date(commande.livreeLe || commande.creeLe)
    return (!min || date >= min) && (!max || date <= max)
  })
}

export function libellesFiltres({ recherche = '' }) {
  return {
    recherche: recherche.trim() ? `« ${recherche.trim()} »` : 'Aucune',
  }
}

export function libellePeriode({ debut, fin }) {
  const format = (valeur) => debutDuJour(valeur).toLocaleDateString('fr-FR')
  if (debut && fin) return `Du ${format(debut)} au ${format(fin)}`
  if (debut) return `Depuis le ${format(debut)}`
  if (fin) return `Jusqu’au ${format(fin)}`
  return 'Toute la période'
}

export function nomFichierExport({ debut, fin }, maintenant = new Date()) {
  const jour = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  if (debut && fin) return `historique-livraisons_${debut}_au_${fin}.xlsx`
  if (debut) return `historique-livraisons_depuis_${debut}.xlsx`
  if (fin) return `historique-livraisons_jusqu-au_${fin}.xlsx`
  return `historique-livraisons_complet_${jour(maintenant)}.xlsx`
}

// Colonnes de l'export : Date/heure de livraison, Ticket, Produits, Canal, Mode, Note.
export function lignesExport(livrees, produits) {
  return livrees.map((commande) => ({
    date: new Date(commande.livreeLe || commande.creeLe),
    ticket: ticketId(commande),
    produits: (commande.lignes || []).map((ligne) => `${ligne.quantite}× ${nomProduit(produits, ligne.produitId)}`).join(', '),
    canal: canalLabel(commande),
    mode: modeLabel(commande.mode),
    note: noteCommande(commande) || '',
  }))
}
