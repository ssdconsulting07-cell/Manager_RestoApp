// Helpers partages du tableau cuisine (Commandes.jsx).
// Les champs optionnels (note, personnalisations, photo) sont affiches s'ils
// arrivent du backend — le contrat MVP ne les expose pas encore tous.

export const REFRESH_MS = 15000

// Habillage partage entre les cartes-filtres (Commandes.jsx) et le badge de
// statut sur chaque carte commande (CommandeRow.jsx) — meme libelle, meme
// icone, meme couleur des deux cotes, pour qu'on associe les deux d'un seul
// coup d'oeil (retour utilisateur : les cartes ne disaient plus leur statut
// une fois les 3 colonnes fusionnees en une seule grille filtrable).
export const STATUT_META = {
  PAYEE: { label: 'Reçue', icon: 'fa-receipt', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  // Bleu plutot que noir (retour utilisateur : la carte-filtre selectionnee
  // ne ressortait pas assez) ; pas rouge, deja reserve au retard is-urgent.
  EN_PREPARATION: { label: 'En préparation', icon: 'fa-fire-burner', accent: '#2f6fed', accentBg: '#e8eefc' },
  PRETE: { label: 'Prête', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  // Commande envoyee au livreur (voir transitions.js) : retour utilisateur —
  // ne doit plus disparaitre du tableau cuisine une fois envoyee, comme
  // PRETE auparavant (meme bug, meme correction, voir useCuisineBoard.js).
  EN_LIVRAISON: { label: 'En livraison', icon: 'fa-motorcycle', accent: '#2f6fed', accentBg: '#e8eefc' },
  // Livree (espace Livreur, voir transitions.js) : meme vert que PRETE —
  // les deux signalent une etape "terminee" positivement.
  LIVREE: { label: 'Livrée', icon: 'fa-flag-checkered', accent: '#1f6f57', accentBg: '#e2f2ec' },
}

const PHOTO_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180">
      <rect fill="#efeae7" width="240" height="180"/>
      <circle cx="120" cy="78" r="28" fill="#d9cdc6"/>
      <rect x="70" y="118" width="100" height="14" rx="7" fill="#d9cdc6"/>
    </svg>`,
  )

// Alerte sonore courte (2 bips) pour signaler une nouvelle commande payee
// sans fixer l'ecran en permanence (retour utilisateur : le personnel ne
// doit pas avoir a surveiller la file en continu pour ne rien manquer).
// Generee a la volee via l'API Web Audio plutot qu'un fichier audio externe
// a charger — un seul AudioContext est reutilise entre les appels. Si
// l'audio est indisponible ou bloque par le navigateur (pas encore
// d'interaction utilisateur sur la page), on se contente de ne rien jouer :
// ce n'est pas critique au fonctionnement du poste.
let contexteAudio = null

function obtenirContexteAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!contexteAudio) contexteAudio = new Ctx()
  return contexteAudio
}

export function jouerAlerteSonore() {
  try {
    const ctx = obtenirContexteAudio()
    if (!ctx) return
    const jouerBip = (delai) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delai)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delai + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delai + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + delai)
      osc.stop(ctx.currentTime + delai + 0.2)
    }
    jouerBip(0)
    jouerBip(0.22)
  } catch {
    // Non critique — voir commentaire ci-dessus.
  }
}

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

// Canal de la commande : passee sur l'app (client chez lui) ou prise au
// comptoir (client deja sur place) — retour utilisateur : les deux se
// confondaient avant, alors que le mode livraison/retrait n'a de sens que
// pour une commande app (une commande comptoir est par definition "sur
// place", donc on ne lui affiche pas de pastille mode). Absence du champ
// canal (donnees API reelles, le contrat /commandes n'expose pas encore ce
// champ) -> on suppose APP par defaut, pour ne rien changer au rendu
// existant tant que le backend ne l'envoie pas.
export function estComptoir(commande) {
  return commande?.canal === 'COMPTOIR'
}

export function canalLabel(commande) {
  return estComptoir(commande) ? 'Sur place' : 'App'
}

// Seuil de retard (20 min) partage entre le badge rouge is-urgent de la
// ligne (CommandeRow.jsx) et le tri par priorite (comparerPriorite) : un
// seul endroit, pour que les deux ne divergent jamais.
export function estUrgente(commande) {
  return Date.now() - new Date(commande.creeLe).getTime() > 20 * 60_000
}

// Ordre d'affichage des commandes (retour utilisateur direct) : priorite
// aux commandes en retard (meme seuil que le badge rouge is-urgent), puis
// FIFO (la plus ancienne d'abord) parmi les commandes de meme urgence, et
// a egalite exacte d'heure d'arrivee, une commande "Sur place" passe
// devant une commande "App" (le client est physiquement present).
// Exportee ici plutot que dupliquee dans Commandes.jsx et
// CuisineDashboard.jsx, pour que les deux ecrans appliquent la meme regle.
export function comparerPriorite(a, b) {
  const urgenteA = estUrgente(a)
  const urgenteB = estUrgente(b)
  if (urgenteA !== urgenteB) return urgenteA ? -1 : 1

  const tempsA = new Date(a.creeLe).getTime()
  const tempsB = new Date(b.creeLe).getTime()
  if (tempsA !== tempsB) return tempsA - tempsB

  const comptoirA = estComptoir(a)
  const comptoirB = estComptoir(b)
  if (comptoirA !== comptoirB) return comptoirA ? -1 : 1

  return 0
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

/** Resume compact des plats d'une commande, ex. "2× Burger, 1× Frites +1" —
 * partage entre l'apercu du tableau de bord (CuisineDashboard.jsx) et
 * l'en-tete repliee d'une ligne de commande (CommandeRow.jsx) : les deux
 * doivent donner une idee de ce qu'il y a a preparer sans tout deplier
 * (retour utilisateur : repliee par defaut, une ligne de commande ne
 * montrait plus du tout les plats). Les `max` premiers sont nommes, le
 * reste est juste compte. */
export function resumePlats(lignes, produits, max = 2) {
  const liste = lignes || []
  if (liste.length === 0) return 'Sans lignes'
  const nommes = liste.slice(0, max).map((l) => `${l.quantite}× ${nomProduit(produits, l.produitId)}`)
  const reste = liste.length - nommes.length
  return reste > 0 ? `${nommes.join(', ')} +${reste}` : nommes.join(', ')
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

/** Accompagnement choisi pour une ligne (ex. "Frites" sur un burger), s'il
 * y en a un — meme champ que cote Vendeur (accompagnementNom, voir
 * Vente.jsx) pour une ligne provenant d'une vraie commande, avec repli sur
 * un tableau accompagnements si le backend finit par en exposer plusieurs
 * par ligne. */
export function texteAccompagnement(ligne) {
  if (!ligne) return null
  if (typeof ligne.accompagnementNom === 'string' && ligne.accompagnementNom.trim()) {
    return ligne.accompagnementNom.trim()
  }
  if (Array.isArray(ligne.accompagnements) && ligne.accompagnements.length) {
    return ligne.accompagnements
      .map((a) => (typeof a === 'string' ? a : a?.nom))
      .filter(Boolean)
      .join(', ')
  }
  return null
}

export function noteCommande(commande) {
  const note = commande?.note ?? commande?.commentaire ?? commande?.messageClient
  return typeof note === 'string' && note.trim() ? note.trim() : null
}

/** Normalise la liste API vers { [id]: { nom, photo } }. */
// Numero de ticket affiche (sans le prefixe demo-) — centralise ici (plutot
// que duplique dans CommandeRow.jsx, Livraisons.jsx, etc.) car utilise par
// plusieurs ecrans des espaces Cuisine et Livreur.
export function ticketId(commande) {
  return String(commande.id).replace(/^demo-/, '')
}

// Meme jour calendaire (heure locale) que maintenant — centralise ici (au
// lieu d'etre duplique entre LivreurDashboard.jsx et Livraisons.jsx) car
// utilise par plusieurs ecrans de l'espace Livreur pour isoler les
// livraisons du jour (KPI « Livrées aujourd'hui », carte-filtre
// « Livrées »).
export function estAujourdhui(iso) {
  if (!iso) return false
  const date = new Date(iso)
  const maintenant = new Date()
  return date.getFullYear() === maintenant.getFullYear()
    && date.getMonth() === maintenant.getMonth()
    && date.getDate() === maintenant.getDate()
}

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
