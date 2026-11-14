// Detail complet d'une commande, partage par la carte depliee (Cuisine,
// Livreur) et le recu imprime : lignes chiffrees, montants, paiement et
// heure de chaque etape. Les montants viennent du serveur (prix figes a la
// commande) ; repli sur le prix du catalogue pour les donnees de demo.
import { STATUT_LABELS } from '../../auth/transitions.js'
import { libelleModePaiement } from '../vendeur/modesPaiement.jsx'
import { nomProduit, texteAccompagnement, textePersonnalisation } from './cuisineUtils.js'

// Acteurs non humains du journal serveur, en clair.
const ACTEURS = { systeme: 'automatique', client: 'client', prestataire: 'paiement confirmé' }

const STATUTS_PAIEMENT = { paye: 'Payé', en_attente: 'En attente', echoue: 'Échoué', rembourse: 'Remboursé' }

export function formatMontant(montant) {
  return `${Number(montant || 0).toLocaleString('fr-FR')} F CFA`
}

export function formatDateHeureComplete(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
  return `${jour} à ${heure}`
}

export function formatHeureCourte(iso) {
  return iso ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : ''
}

/** Lignes chiffrees : quantite, prix unitaire (accompagnement compris), total. */
export function lignesChiffrees(commande, produits = {}) {
  return (commande?.lignes || []).map((ligne) => {
    const idProduit = ligne.produitId
    const prixCatalogue = produits?.[idProduit]?.prix
    const prixUnitaire = Number(ligne.prixUnitaire ?? ligne.prix ?? prixCatalogue ?? 0)
    const quantite = Number(ligne.quantite || 0)
    return {
      nom: nomProduit(produits, ligne),
      quantite,
      prixUnitaire,
      total: prixUnitaire * quantite,
      accompagnement: texteAccompagnement(ligne),
      accompagnementPrix: ligne.accompagnementPrix ? Number(ligne.accompagnementPrix) : null,
      personnalisation: textePersonnalisation(ligne),
    }
  })
}

export function montantsCommande(commande, produits = {}) {
  const lignes = lignesChiffrees(commande, produits)
  const sousTotalLignes = lignes.reduce((s, l) => s + l.total, 0)
  const sousTotal = Number(commande?.sousTotal ?? sousTotalLignes)
  const frais = Number(commande?.fraisLivraison ?? 0)
  return {
    lignes,
    articles: lignes.reduce((s, l) => s + l.quantite, 0),
    sousTotal,
    frais,
    total: Number(commande?.total ?? sousTotal + frais),
  }
}

export function paiementCommande(commande) {
  const moyen = commande?.moyenPaiement
  return {
    moyen: moyen ? libelleModePaiement(moyen) : null,
    statut: STATUTS_PAIEMENT[commande?.statutPaiement] || null,
    montantRecu: commande?.montantRecu ?? null,
    monnaieRendue: commande?.monnaieRendue ?? null,
  }
}

/** Heure de chaque etape (historique du serveur), dans l'ordre. */
export function etapesHoraires(commande) {
  const historique = Array.isArray(commande?.historique) ? commande.historique : []
  const etapes = historique
    .filter((h) => h?.statut && h?.le && h.statut !== 'CREEE')
    .map((h) => ({ statut: h.statut, libelle: STATUT_LABELS[h.statut] || h.statut, heure: formatHeureCourte(h.le), le: h.le, par: h.par ? (ACTEURS[h.par] || h.par) : null }))
  if (!etapes.length && commande?.creeLe) {
    etapes.push({ statut: commande.statut, libelle: 'Commandée', heure: formatHeureCourte(commande.creeLe), le: commande.creeLe, par: null })
  }
  return etapes
}
