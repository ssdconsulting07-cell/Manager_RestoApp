// Helpers partages Cuisine (Commandes + Preparation).
// Les champs optionnels (note, personnalisations, photo) sont affiches s'ils
// arrivent du backend — le contrat MVP ne les expose pas encore tous.

export const REFRESH_MS = 15000

const PHOTO_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180">
      <rect fill="#efeae7" width="240" height="180"/>
      <circle cx="120" cy="78" r="28" fill="#d9cdc6"/>
      <rect x="70" y="118" width="100" height="14" rx="7" fill="#d9cdc6"/>
    </svg>`,
  )

export function filtrerParStatuts(commandes, statuts) {
  return commandes
    .filter((c) => statuts.includes(c.statut))
    .sort((a, b) => new Date(a.creeLe) - new Date(b.creeLe))
}

export function formatHeure(iso) {
  return iso
    ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''
}

export function formatDuree(iso) {
  if (!iso) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'À l’instant'
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const reste = minutes % 60
  return reste ? `${heures} h ${reste} min` : `${heures} h`
}

export function modeLabel(mode) {
  return mode === 'LIVRAISON' ? 'Livraison' : 'Retrait'
}

function ficheProduit(produits, produitId) {
  const p = produits?.[produitId]
  if (!p) return null
  if (typeof p === 'string') return { nom: p, photo: null }
  return p
}

export function nomProduit(produits, produitId) {
  return ficheProduit(produits, produitId)?.nom || `Produit ${produitId}`
}

export function photoProduit(produits, produitId) {
  const fiche = ficheProduit(produits, produitId)
  return fiche?.photo || fiche?.image || fiche?.imageUrl || PHOTO_FALLBACK
}

export function textePersonnalisation(ligne) {
  if (!ligne) return null
  if (typeof ligne.personnalisation === 'string' && ligne.personnalisation.trim()) {
    return ligne.personnalisation.trim()
  }
  if (Array.isArray(ligne.personnalisations) && ligne.personnalisations.length) {
    return ligne.personnalisations.filter(Boolean).join(', ')
  }
  if (typeof ligne.note === 'string' && ligne.note.trim()) return ligne.note.trim()
  return null
}

export function noteCommande(commande) {
  const note = commande?.note ?? commande?.commentaire ?? commande?.messageClient
  return typeof note === 'string' && note.trim() ? note.trim() : null
}

/** Normalise la liste API vers { [id]: { nom, photo } }. */
export function mapProduitsParId(liste) {
  return Object.fromEntries(
    (liste || []).map((p) => [
      p.id,
      {
        nom: p.nom,
        photo: p.photo || p.image || p.imageUrl || null,
      },
    ]),
  )
}
