// Donnees fictives Cuisine — utilisees tant que le backend n'a pas (encore)
// de commandes PAYEE / EN_PREPARATION. Desactive automatiquement des que
// l'API renvoie de vraies commandes actives.
// Store partage en memoire pour que Commandes et Preparation voient les memes mutations.

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

const DEMO_VERSION = 4

const DEMO_SEED = [
  // --- File d'attente (PAYEE) ---
  {
    id: 'demo-1051',
    statut: 'PAYEE',
    mode: 'RETRAIT',
    creeLe: minutesAgo(2),
    note: 'Sans oignon s’il vous plaît',
    lignes: [
      { produitId: 'p-burger', quantite: 2, personnalisation: 'Sans oignon' },
      { produitId: 'p-fries', quantite: 1 },
      { produitId: 'p-cola', quantite: 2 },
    ],
  },
  {
    id: 'demo-1055',
    statut: 'PAYEE',
    mode: 'RETRAIT',
    creeLe: minutesAgo(4),
    note: 'Commande express — 1 seul article',
    lignes: [{ produitId: 'p-burger', quantite: 1, personnalisation: 'Bien cuit' }],
  },
  {
    id: 'demo-1052',
    statut: 'PAYEE',
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
    mode: 'LIVRAISON',
    creeLe: minutesAgo(7),
    lignes: [{ produitId: 'p-nuggets12', quantite: 1 }],
  },
  {
    id: 'demo-1053',
    statut: 'PAYEE',
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
    mode: 'RETRAIT',
    creeLe: minutesAgo(15),
    note: 'Ticket simple — un seul plat',
    lignes: [{ produitId: 'p-salade', quantite: 1, personnalisation: 'Sans croûtons' }],
  },
  {
    id: 'demo-1047',
    statut: 'EN_PREPARATION',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(17),
    lignes: [
      { produitId: 'p-burger', quantite: 3 },
      { produitId: 'p-fries', quantite: 2 },
      { produitId: 'p-cola', quantite: 3 },
    ],
  },
  {
    id: 'demo-1058',
    statut: 'EN_PREPARATION',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(19),
    lignes: [{ produitId: 'p-dessert', quantite: 2 }],
  },
  {
    id: 'demo-1048',
    statut: 'EN_PREPARATION',
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
    mode: 'RETRAIT',
    creeLe: minutesAgo(32),
    lignes: [{ produitId: 'p-cheese', quantite: 1 }],
  },
  {
    id: 'demo-1045',
    statut: 'PRETE',
    mode: 'LIVRAISON',
    creeLe: minutesAgo(38),
    lignes: [
      { produitId: 'p-burger', quantite: 2 },
      { produitId: 'p-fries', quantite: 2 },
      { produitId: 'p-dessert', quantite: 2 },
    ],
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
    commandes: liste.map((c) => (c.id === id ? { ...c, statut } : c)),
  }
  return demoState.commandes.find((c) => c.id === id)
}

/** Si l'API n'a aucune commande active cuisine, on bascule sur la démo. */
export function avecDemoSiVide(commandesApi) {
  const liste = Array.isArray(commandesApi) ? commandesApi : []
  const aActives = liste.some((c) => c.statut === 'PAYEE' || c.statut === 'EN_PREPARATION')
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
