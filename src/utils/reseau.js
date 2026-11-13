// Surveillance de la connexion — meme logique que Client_RestoApp
// (src/utils/reseau.js) : trois etats, des toasts aux changements d'etat.
//
//   en-ligne   : tout va bien.
//   instable   : reponses lentes, coupures intermittentes ou reseau 2G.
//   hors-ligne : navigateur hors ligne, ou deux echecs d'affilee.
//
// Les echantillons viennent de deux sources : une sonde reguliere (GET
// /health, sans base de donnees cote backend) et les vrais appels API
// (signalerRequete, branche dans api/client.js) — une requete qui echoue
// declenche une verification immediate au lieu d'attendre la sonde.

export const ETATS = { EN_LIGNE: 'en-ligne', INSTABLE: 'instable', HORS_LIGNE: 'hors-ligne' }

const INTERVALLE_NORMAL_MS = 12000
const INTERVALLE_DEGRADE_MS = 4000; // retour du reseau detecte plus vite
const DELAI_SONDE_MS = 5000
const SEUIL_LENT_MS = 2500
const FENETRE = 6

// Etat deduit des derniers echantillons ({ ok, duree }). Fonction pure,
// testee dans reseau.test.js.
export function evaluerEtat({ enLigneNavigateur = true, echantillons = [], typeConnexion = '', etatCourant = ETATS.EN_LIGNE, seuilLentMs = SEUIL_LENT_MS }) {
  if (!enLigneNavigateur) return ETATS.HORS_LIGNE
  const d = echantillons.slice(-FENETRE)
  const n = d.length
  if (n === 0) return etatCourant
  const dernier = d[n - 1]
  if (!dernier.ok) {
    // Deux echecs d'affilee : hors ligne. Un seul : on attend confirmation
    // (la prochaine sonde part tout de suite) sans changer d'etat.
    if (n >= 2 && !d[n - 2].ok) return ETATS.HORS_LIGNE
    return etatCourant
  }
  if (typeConnexion === 'slow-2g' || typeConnexion === '2g') return ETATS.INSTABLE
  // Coupures intermittentes : ok/echec qui alternent (une coupure suivie
  // d'un retour ne compte que pour 2 bascules).
  let bascules = 0
  for (let i = 1; i < n; i += 1) if (d[i].ok !== d[i - 1].ok) bascules += 1
  if (bascules >= 3) return ETATS.INSTABLE
  // Lenteur : au moins deux des trois dernieres reponses lentes.
  const reussites = d.filter((e) => e.ok).slice(-3)
  if (reussites.filter((e) => e.duree > seuilLentMs).length >= 2) return ETATS.INSTABLE
  return ETATS.EN_LIGNE
}

// Message a afficher pour un changement d'etat (null = rien a dire).
export function messageTransition(avant, apres) {
  if (avant === apres) return null
  if (apres === ETATS.HORS_LIGNE) {
    return { type: 'erreur', texte: 'Vous êtes hors ligne. Vérifiez votre connexion internet.' }
  }
  if (apres === ETATS.INSTABLE) {
    return {
      type: 'alerte',
      texte: avant === ETATS.HORS_LIGNE ? 'Connexion revenue, mais encore instable.' : 'Connexion instable : l’app peut être plus lente.',
    }
  }
  return { type: 'succes', texte: 'Connexion rétablie.' }
}

let surveillanceActive = null

// Appele par le client API apres chaque requete.
export function signalerRequete(echantillon) {
  surveillanceActive?.ajouter(echantillon, { depuisRequete: true })
}

export function demarrerSurveillanceReseau({ urlSonde, onChange }) {
  let etat = ETATS.EN_LIGNE
  let echantillons = []
  let minuteur = null
  let sondeEnCours = false
  let derniereSonde = 0
  let arrete = false

  const typeConnexion = () => navigator.connection?.effectiveType || ''

  function reevaluer() {
    const suivant = evaluerEtat({
      enLigneNavigateur: navigator.onLine,
      echantillons,
      typeConnexion: typeConnexion(),
      etatCourant: etat,
    })
    if (suivant !== etat) {
      const avant = etat
      etat = suivant
      onChange(suivant, avant)
    }
    planifier()
  }

  function ajouter(echantillon, { depuisRequete = false } = {}) {
    if (arrete) return
    echantillons = [...echantillons, echantillon].slice(-FENETRE)
    reevaluer()
    // Une vraie requete qui echoue : verification immediate.
    if (depuisRequete && !echantillon.ok) sonder()
  }

  function planifier() {
    clearTimeout(minuteur)
    if (arrete) return
    minuteur = setTimeout(sonder, etat === ETATS.EN_LIGNE ? INTERVALLE_NORMAL_MS : INTERVALLE_DEGRADE_MS)
  }

  async function sonder() {
    if (arrete || sondeEnCours || Date.now() - derniereSonde < 1500) return
    if (!navigator.onLine) {
      reevaluer()
      return
    }
    sondeEnCours = true
    derniereSonde = Date.now()
    const controleur = new AbortController()
    const delai = setTimeout(() => controleur.abort(), DELAI_SONDE_MS)
    const debut = performance.now()
    try {
      // Toute reponse HTTP prouve que le serveur est joignable. Mode
      // no-cors : on ne lit pas la reponse, donc une regle CORS (ou une
      // erreur HTTP) ne fait pas croire a tort a une coupure.
      await fetch(urlSonde, { cache: 'no-store', mode: 'no-cors', signal: controleur.signal })
      ajouter({ ok: true, duree: performance.now() - debut })
    } catch {
      ajouter({ ok: false, duree: performance.now() - debut })
    } finally {
      clearTimeout(delai)
      sondeEnCours = false
    }
  }

  const surHorsLigne = () => reevaluer()
  const surEnLigne = () => {
    derniereSonde = 0
    sonder()
  }
  const surVisibilite = () => document.visibilityState === 'visible' && sonder()

  window.addEventListener('offline', surHorsLigne)
  window.addEventListener('online', surEnLigne)
  document.addEventListener('visibilitychange', surVisibilite)
  navigator.connection?.addEventListener?.('change', reevaluer)

  surveillanceActive = { ajouter }
  if (!navigator.onLine) reevaluer()
  sonder()

  return () => {
    arrete = true
    clearTimeout(minuteur)
    if (surveillanceActive?.ajouter === ajouter) surveillanceActive = null
    window.removeEventListener('offline', surHorsLigne)
    window.removeEventListener('online', surEnLigne)
    document.removeEventListener('visibilitychange', surVisibilite)
    navigator.connection?.removeEventListener?.('change', reevaluer)
  }
}
