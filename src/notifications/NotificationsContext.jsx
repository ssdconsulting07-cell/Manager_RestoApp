import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import useFluxCommandes from '../hooks/useFluxCommandes.js'

// Notifications de la cloche, alimentees par le flux temps reel des commandes
// (GET /temps-reel/commandes, deja filtre par role cote serveur). Chaque role
// ne recoit que ce qui le concerne :
//   CUISINE         : nouvelle commande payee ;
//   LIVREUR         : livraison prete a recuperer, livraison qui lui est confiee ;
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
    if (statut === 'EN_LIVRAISON') return { ...base, kind: 'livraison', title: `Livraison ${ticket(commande)} en route`, text: `Commande confiée au livreur${commande.adresseLivraison ? ` pour ${commande.adresseLivraison}` : ''}.`, target: '/livraisons' }
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

export function NotificationsProvider({ children }) {
  const { role, username } = useAuth()
  const cleStockage = username ? `senyummies_manager_notifications_${username}` : null
  const [notifications, setNotifications] = useState(() => (cleStockage ? lire(cleStockage) : []))
  const cleCourante = useRef(cleStockage)

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
    setNotifications((liste) => {
      if (liste.some((x) => x.cle === n.cle)) return liste
      return [{ ...n, id: `${n.cle}-${Date.now()}`, createdAt: new Date().toISOString(), unread: true }, ...liste].slice(0, MAX)
    })
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
