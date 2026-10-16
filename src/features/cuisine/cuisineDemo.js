// Donnees fictives Cuisine — utilisees tant que le backend n'a pas (encore)
// de commande active (PAYEE / EN_PREPARATION / PRETE). Desactive automatiquement
// des que l'API renvoie au moins une vraie commande active, quelle que soit
// sa colonne — y compris PRETE (bug corrige : une commande reelle marquee
// prete declenchait a tort la demo dès qu'il n'y avait plus ni PAYEE ni
// EN_PREPARATION, et la remplaçait purement et simplement par le jeu de
// demo, ce qui est exactement ce que la colonne "Prêtes" devait eviter).
// Store partage en memoire pour que le tableau cuisine (Commandes.jsx) voie
// des mutations coherentes entre deux rafraichissements.

// Photos fictives (Unsplash) — en attendant les images produit du backend.
const img = (id, w = 480) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${360}&q=80`

export const DEMO_PRODUITS = {
  'p-burger': { nom: 'Classic Burger', photo: img('photo-1568901346375-23c9450c58cd') },
  'p-cheese': { nom: 'Cheese Burger', photo: img('photo-1550547660-d9450f859349') },
  'p-double': { nom: 'Double Smash', photo: img('photo-1553979459-d2229ba7433b') },
  'p-chicken': { nom: 'Chicken Burger', photo: img('photo-1606755962773-d324e0a13086') },
  'p-fries': { nom: 'Frites maison', photo: img('photo-1573080496219-bb080dd4f877') },
  'p-fries-l': { nom: 'Grande frite', photo: img('photo-1630384060421-f6e72a5eab7b') },
  'p-cola': { nom: 'Coca-Cola', photo: img('photo-1622483767028-3f66f32aef97') },
  'p-sprite': { nom: 'Sprite', photo: img('photo-1625772299848-391b6a87d7b3') },
  'p-jus': { nom: 'Jus de bissap', photo: img('photo-1546173159-315724a31696') },
  'p-nuggets': { nom: 'Nuggets x6', photo: img('photo-1562967914-608f82629710') },
  'p-nuggets12': { nom: 'Nuggets x12', photo: img('photo-1615367437471-65d8f4f1f023') },
  'p-wrap': { nom: 'Wrap poulet', photo: img('photo-1626700051175-6818013e1d4f') },
  'p-salade': { nom: 'Salade César', photo: img('photo-1546793665-c74683f339c1') },
  'p-onion': { nom: 'Onion rings', photo: img('photo-1639024471283-035266109ceb') },
  'p-eau': { nom: 'Eau minérale', photo: img('photo-1548839140-29a749e1cf4d') },
  'p-dessert': { nom: 'Brownie', photo: img('photo-1606313564200-e75d5e30476c') },
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60_000).toISOString()
}

const DEMO_VERSION = 8

const DEMO_SEED = [
  // --- File d'attente (PAYEE) ---
  {
    id: 'demo-1051',
    statut: 'PAYEE',
    canal: 'APP',
    mode: 'RETRAIT',
    creeLe: minutesAgo(2),
    note: 'Sans oignon s’il vous plaît',
    lignes: [
      { produitId: 'p-burger', quantite: 2, personnalisation: 'Sans oignon', accompagnementNom: 'Frites' },
      { produitId: 'p-fries', quantite: 1 },
      { produitId: 'p-cola', quantite: 2 },
    ],
  },
  {
    id: 'demo-1055',
    statut: 'PAYEE',
    canal: 'COMPTOIR',
    creeLe: minutesAgo(4),
    note: 'Commande express — 1 seul article',
    lignes: [{ produitId: 'p-burger', quantite: 1, personnalisation: 'Bien cuit' }],
  },
  {
    id: 'demo-1052',
    statut: 'PAYEE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(5),
    note: 'Sonner à l’interphone B12',
    lignes: [
      { produitId: 'p-double', quantite: 1, personnalisation: 'Extra cheddar' },
      { produitId: 'p-onion', quantite: 1 },
      { produitId: 'p-sprite', quantite: 1 },
    ],
  },
  {
    id: 'demo-1056',
    statut: 'PAYEE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(7),
    lignes: [{ produitId: 'p-nuggets12', quantite: 1 }],
  },
  {
    id: 'demo-1053',
    statut: 'PAYEE',
    canal: 'APP',
    mode: 'RETRAIT',
    creeLe: minutesAgo(9),
    lignes: [
      { produitId: 'p-chicken', quantite: 2 },
      { produitId: 'p-fries-l', quantite: 1 },
      { produitId: 'p-jus', quantite: 2 },
      { produitId: 'p-dessert', quantite: 1 },
    ],
  },
  {
    id: 'demo-1054',
    statut: 'PAYEE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(11),
    lignes: [
      { produitId: 'p-cheese', quantite: 1 },
      { produitId: 'p-nuggets', quantite: 1 },
      { produitId: 'p-eau', quantite: 2 },
    ],
  },
  // --- Poste préparation (EN_PREPARATION) ---
  {
    id: 'demo-1046',
    statut: 'EN_PREPARATION',
    canal: 'APP',
    mode: 'RETRAIT',
    creeLe: minutesAgo(14),
    note: 'Retour client — bien cuit',
    lignes: [
      { produitId: 'p-wrap', quantite: 1, personnalisation: 'Sauce à part' },
      { produitId: 'p-salade', quantite: 1 },
    ],
  },
  {
    id: 'demo-1057',
    statut: 'EN_PREPARATION',
    canal: 'COMPTOIR',
    creeLe: minutesAgo(15),
    note: 'Ticket simple — un seul plat',
    lignes: [{ produitId: 'p-salade', quantite: 1, personnalisation: 'Sans croûtons' }],
  },
  {
    id: 'demo-1047',
    statut: 'EN_PREPARATION',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(17),
    lignes: [
      { produitId: 'p-burger', quantite: 3, accompagnementNom: 'Onion rings' },
      { produitId: 'p-fries', quantite: 2 },
      { produitId: 'p-cola', quantite: 3 },
    ],
  },
  {
    id: 'demo-1058',
    statut: 'EN_PREPARATION',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(19),
    lignes: [{ produitId: 'p-dessert', quantite: 2 }],
  },
  {
    id: 'demo-1048',
    statut: 'EN_PREPARATION',
    canal: 'APP',
    mode: 'RETRAIT',
    creeLe: minutesAgo(21),
    note: 'Allergie sésame',
    lignes: [
      { produitId: 'p-chicken', quantite: 1, personnalisation: 'Sans pain sésame' },
      { produitId: 'p-nuggets12', quantite: 1 },
      { produitId: 'p-jus', quantite: 1 },
    ],
  },
  {
    id: 'demo-1049',
    statut: 'EN_PREPARATION',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(25),
    lignes: [
      { produitId: 'p-double', quantite: 2, personnalisation: 'Bien cuit' },
      { produitId: 'p-fries-l', quantite: 2 },
      { produitId: 'p-onion', quantite: 1 },
      { produitId: 'p-sprite', quantite: 2 },
    ],
  },
  // --- Prêtes (compteur dashboard) ---
  {
    id: 'demo-1044',
    statut: 'PRETE',
    canal: 'COMPTOIR',
    creeLe: minutesAgo(32),
    lignes: [{ produitId: 'p-cheese', quantite: 1 }],
  },
  {
    id: 'demo-1045',
    statut: 'PRETE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(38),
    lignes: [
      { produitId: 'p-burger', quantite: 2 },
      { produitId: 'p-fries', quantite: 2 },
      { produitId: 'p-dessert', quantite: 2 },
    ],
  },
  // --- En livraison (reste visible, ne disparait plus — retour utilisateur) ---
  {
    id: 'demo-1042',
    statut: 'EN_LIVRAISON',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(44),
    lignes: [
      { produitId: 'p-wrap', quantite: 1 },
      { produitId: 'p-jus', quantite: 1 },
    ],
  },
  // --- Livrees (historique Livreur, voir HistoriqueLivraisons.jsx) ---
  // livreeLe : horodatage de la remise au client, distinct de creeLe
  // (heure de commande) — absent du contrat API actuel (commandes/ est
  // un paquet vide cote backend), ajoute ici cote mock en attendant ;
  // stampe de la meme facon a l'execution par patchStatutDemo ci-dessous
  // des qu'une vraie commande EN_LIVRAISON passe a LIVREE.
  {
    id: 'demo-1040',
    statut: 'LIVREE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(130),
    livreeLe: minutesAgo(95),
    lignes: [
      { produitId: 'p-burger', quantite: 1 },
      { produitId: 'p-cola', quantite: 1 },
    ],
  },
  {
    id: 'demo-1038',
    statut: 'LIVREE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(190),
    livreeLe: minutesAgo(160),
    lignes: [
      { produitId: 'p-double', quantite: 2 },
      { produitId: 'p-fries-l', quantite: 1 },
    ],
  },
  {
    id: 'demo-1021',
    statut: 'LIVREE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(1485),
    livreeLe: minutesAgo(1450),
    lignes: [
      { produitId: 'p-wrap', quantite: 1 },
      { produitId: 'p-jus', quantite: 1 },
    ],
  },
  {
    id: 'demo-1005',
    statut: 'LIVREE',
    canal: 'APP',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(4340),
    livreeLe: minutesAgo(4320),
    lignes: [{ produitId: 'p-cheese', quantite: 3 }],
  },
]

/** @type {{ version: number, active: boolean, commandes: typeof DEMO_SEED } | null} */
let demoState = null

function cloneSeed() {
  return DEMO_SEED.map((c) => ({ ...c, lignes: c.lignes.map((l) => ({ ...l })) }))
}

export function isDemoId(id) {
  return typeof id === 'string' && id.startsWith('demo-')
}

export function getDemoCommandes() {
  if (!demoState || demoState.version !== DEMO_VERSION) {
    demoState = { version: DEMO_VERSION, active: true, commandes: cloneSeed() }
  }
  return demoState.commandes
}

export function patchDemoStatut(id, statut) {
  const liste = getDemoCommandes()
  demoState = {
    version: DEMO_VERSION,
    active: true,
    // livreeLe : stampe uniquement au passage reel a LIVREE (scan QR, voir
    // ScanLivraisonModal.jsx), jamais recalcule sur un simple rechargement —
    // sert a dater l'Historique des livraisons (HistoriqueLivraisons.jsx).
    commandes: liste.map((c) =>
      c.id === id
        ? { ...c, statut, ...(statut === 'LIVREE' ? { livreeLe: new Date().toISOString() } : {}) }
        : c,
    ),
  }
  return demoState.commandes.find((c) => c.id === id)
}

/** Si l'API n'a aucune commande active cuisine, on bascule sur la démo —
 * seulement en developpement (import.meta.env.DEV). En production, basculer
 * sur de fausses commandes serait dangereux (releve agent local) : lors
 * d'une panne reelle de l'API (voir le bloc catch de charger() dans
 * useCuisineBoard.js, qui appelle cette fonction avec une liste vide), la
 * cuisine se retrouverait a preparer des plats fictifs sans le moindre
 * signal visible — le mot "demo" affiche a l'ecran etait le seul indice,
 * et il a ete retire pour de bonnes raisons (voir Commandes.jsx). En
 * production, une cuisine reellement vide affiche donc desormais "Aucune
 * commande" comme n'importe quel autre ecran vide, et une panne reste
 * signalee normalement. En dev, le comportement est inchange : la demo
 * comble toujours une cuisine vide pour pouvoir travailler sans backend. */
export function avecDemoSiVide(commandesApi) {
  const liste = Array.isArray(commandesApi) ? commandesApi : []
  if (!import.meta.env.DEV) {
    return { commandes: liste, demo: false }
  }
  const aActives = liste.some(
    (c) => c.statut === 'PAYEE' || c.statut === 'EN_PREPARATION' || c.statut === 'PRETE' || c.statut === 'EN_LIVRAISON',
  )
  if (aActives) {
    demoState = { version: DEMO_VERSION, active: false, commandes: [] }
    return { commandes: liste, demo: false }
  }
  return { commandes: getDemoCommandes(), demo: true }
}

export function mergeProduitsDemo(produitsApi) {
  const out = { ...DEMO_PRODUITS }
  for (const [id, p] of Object.entries(produitsApi || {})) {
    const base = typeof out[id] === 'object' ? out[id] : { nom: out[id], photo: null }
    out[id] = {
      nom: p?.nom || base?.nom || id,
      photo: p?.photo || base?.photo || null,
    }
  }
  return out
}
