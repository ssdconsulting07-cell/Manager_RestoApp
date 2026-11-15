import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import useFluxCommandes from '../hooks/useFluxCommandes.js'

// Notifications de la cloche, alimentees par le flux temps reel des commandes
// (GET /temps-reel/commandes, deja filtre par role cote serveur). Chaque role
// ne recoit que ce qui le concerne :
//   CUISINE         : nouvelle commande payee ;
//   LIVREUR         : commande envoyee par la cuisine, a prendre (le premier
//                     qui la prend l'a), commande prete en cuisine ;
//   VENDEUR         : commande a emporter prete a remettre ;
//   GERANT, MANAGER : nouvelle commande, commande annulee, livraison effectuee.
// Gardees sur l'appareil (50 dernieres, par utilisateur), avec leur etat lu / non lu.
const NotificationsContext = createContext(null)
const MAX = 50

function ticket(commande) {
  return `#${String(commande?.id ?? '').replace(/^demo-/, '')}`
}

function montant(commande) {
  return commande?.total != null ? ` · ${Number(commande.total).toLocaleString('fr-FR')} F CFA` : ''
}

// Evenement serveur -> notification (ou null si sans interet pour ce role).
export function notificationPour(role, { type, commande } = {}) {
  if (!commande) return null
  const statut = commande.statut
  const livraison = commande.mode === 'LIVRAISON'
  const comptoir = commande.canal === 'COMPTOIR'
  const base = { cle: `${commande.id}-${statut}`, commandeId: commande.id }
  const nouvelle = type === 'COMMANDE_PAYEE' || statut === 'PAYEE'

  if (role === 'CUISINE' && nouvelle) {
    return { ...base, kind: 'commande', title: `Nouvelle commande ${ticket(commande)}`, text: `${comptoir ? 'Vente comptoir' : livraison ? 'Livraison' : 'À emporter'}${montant(commande)} : à préparer.`, target: '/commandes' }
  }
  if (role === 'LIVREUR' && livraison) {
    if (statut === 'PRETE') return { ...base, kind: 'prete', title: `Commande ${ticket(commande)} prête`, text: `À récupérer en cuisine${commande.adresseLivraison ? `, livraison à ${commande.adresseLivraison}` : ''}.`, target: '/livraisons' }
    // Envoyee par la cuisine, pas encore prise : premier arrive, premier servi.
    if (statut === 'EN_LIVRAISON' && !commande.livreur) return { ...base, kind: 'livraison', title: `Commande ${ticket(commande)} à prendre`, text: `Envoyée par la cuisine${commande.adresseLivraison ? `, livraison à ${commande.adresseLivraison}` : ''}. Le premier qui la prend l'a.`, target: '/livraisons' }
  }
  if (role === 'VENDEUR' && !livraison && statut === 'PRETE') {
    return { ...base, kind: 'prete', title: `Commande ${ticket(commande)} prête`, text: 'À remettre au client au comptoir.', target: '/vente' }
  }
  if (role === 'GERANT' || role === 'MANAGER') {
    if (nouvelle) return { ...base, kind: 'commande', title: `Nouvelle commande ${ticket(commande)}`, text: `${comptoir ? 'Vente comptoir' : livraison ? 'Livraison' : 'À emporter'}${montant(commande)}.`, target: '/dashboard' }
    if (statut === 'ANNULEE') return { ...base, kind: 'annulee', title: `Commande ${ticket(commande)} annulée`, text: commande.statutPaiement === 'paye' ? 'Commande déjà payée : remboursement à prévoir.' : 'Paiement non abouti ou annulation en cuisine.', target: role === 'MANAGER' ? '/journal-audit/cuisine' : '/dashboard' }
    if (statut === 'LIVREE') return { ...base, kind: 'livraison', title: `Commande ${ticket(commande)} livrée`, text: `Livraison effectuée${montant(commande)}.`, target: '/dashboard' }
  }
  return null
}

// "À l'instant", "Il y a 5 min", "Il y a 2 h", "Hier", "Il y a 3 j".
export function tempsEcoule(iso, maintenant = Date.now()) {
  const min = Math.max(0, Math.floor((maintenant - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'À l’instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  const j = Math.floor(h / 24)
  return j === 1 ? 'Hier' : `Il y a ${j} j`
}

function lire(cle) {
  try {
    const brut = JSON.parse(localStorage.getItem(cle))
    return Array.isArray(brut) ? brut : []
  } catch {
    return []
  }
}

// Signal sonore court (deux notes) a l'arrivee d'une notification, sans
// fichier audio. Desactivable : localStorage senyummies_manager_son = "0".
let contexteAudio = null
export function jouerSonNotification() {
  try {
    if (localStorage.getItem('senyummies_manager_son') === '0') return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    contexteAudio = contexteAudio || new Ctx()
    const t = contexteAudio.currentTime
    ;[880, 1320].forEach((frequence, i) => {
      const osc = contexteAudio.createOscillator()
      const gain = contexteAudio.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequence
      gain.gain.setValueAtTime(0.0001, t + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.15)
      osc.connect(gain).connect(contexteAudio.destination)
      osc.start(t + i * 0.16)
      osc.stop(t + i * 0.16 + 0.16)
    })
  } catch {
    // audio indisponible (navigateur, autoplay bloque) : la cloche suffit
  }
}

export function NotificationsProvider({ children }) {
  const { role, username } = useAuth()
  const cleStockage = username ? `senyummies_manager_notifications_${username}` : null
  const [notifications, setNotifications] = useState(() => (cleStockage ? lire(cleStockage) : []))
  const cleCourante = useRef(cleStockage)
  const listeRef = useRef(notifications)
  listeRef.current = notifications

  // Changement d'utilisateur (deconnexion / autre compte) : sa propre liste.
  useEffect(() => {
    cleCourante.current = cleStockage
    setNotifications(cleStockage ? lire(cleStockage) : [])
  }, [cleStockage])

  useEffect(() => {
    if (!cleCourante.current) return
    try { localStorage.setItem(cleCourante.current, JSON.stringify(notifications.slice(0, MAX))) } catch { /* stockage plein ou bloque */ }
  }, [notifications])

  useFluxCommandes((evenement) => {
    const n = notificationPour(role, evenement)
    if (!n) return
    // Doublon (meme commande, meme statut, ex. evenement rattrape) : rien.
    if (listeRef.current.some((x) => x.cle === n.cle)) return
    const nouvelle = true
    listeRef.current = [{ cle: n.cle }, ...listeRef.current]
    setNotifications((liste) => {
      if (liste.some((x) => x.cle === n.cle)) return liste
      return [{ ...n, id: `${n.cle}-${Date.now()}`, createdAt: new Date().toISOString(), unread: true }, ...liste].slice(0, MAX)
    })
    // Pas de son pour les evenements rattrapes de plus de 10 minutes
    // (reconnexion apres une coupure).
    const recente = !evenement.commande?.creeLe || Date.now() - new Date(evenement.commande.creeLe).getTime() < 10 * 60_000
      || evenement.commande?.statut !== 'PAYEE'
    if (nouvelle && recente) jouerSonNotification()
  }, { actif: Boolean(role) })

  const marquerLue = useCallback((id) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n))), [])
  const toutMarquerLu = useCallback(() => setNotifications((l) => l.map((n) => ({ ...n, unread: false }))), [])
  const supprimer = useCallback((id) => setNotifications((l) => l.filter((n) => n.id !== id)), [])

  const valeur = useMemo(() => ({ notifications, marquerLue, toutMarquerLu, supprimer }), [notifications, marquerLue, toutMarquerLu, supprimer])
  return <NotificationsContext.Provider value={valeur}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext) || { notifications: [], marquerLue: () => {}, toutMarquerLu: () => {}, supprimer: () => {} }
}
