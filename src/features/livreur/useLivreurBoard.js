import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPatch } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { STATUT_LABELS } from '../../auth/transitions.js'
import { avecDemoSiVide, getDemoCommandes, isDemoId, mergeProduitsDemo, patchDemoStatut } from '../cuisine/cuisineDemo.js'
import { REFRESH_MS, mapProduitsParId } from '../cuisine/cuisineUtils.js'

// Les 2 statuts geres par le livreur : PRETE (lecture seule, en attente
// d'envoi par la cuisine — voir Livraisons.jsx) et EN_LIVRAISON
// (actionnable, scan QR -> LIVREE). Seules les commandes en mode LIVRAISON
// sont concernees (un retrait au comptoir n'a pas de livreur). Meme
// endpoint /commandes et meme repli demo que useCuisineBoard.js : les deux
// hooks regardent le meme etat partage sous deux angles differents, pas
// deux sources de verite separees — sinon les compteurs des deux espaces
// pourraient diverger (meme bug que celui deja corrige une fois sur le
// KPI "Prêtes", voir cuisineUtils.js/CuisineDashboard.jsx).
const STATUTS_LIVREUR = ['PRETE', 'EN_LIVRAISON']

function estLivraison(commande) {
  return commande.mode === 'LIVRAISON'
}

export function useLivreurBoard() {
  const { role } = useAuth()
  const [commandes, setCommandes] = useState([])
  // Commandes livrees (mode LIVRAISON, statut LIVREE) — alimente a la fois
  // le KPI "Livrées aujourd'hui" du tableau de bord et l'ecran Historique
  // (HistoriqueLivraisons.jsx), qui filtre lui-meme par periode.
  const [livrees, setLivrees] = useState([])
  const [produits, setProduits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demo, setDemo] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [nouvelleAlerte, setNouvelleAlerte] = useState(null)
  const mutationVersion = useRef(0)
  // null = aucune reponse reelle de l'API encore recue, voir useCuisineBoard.js
  // pour le detail de cette convention.
  const idsEnLivraisonConnus = useRef(null)

  const apply = useCallback((liste, isDemo) => {
    setDemo(isDemo)
    const livraisons = liste.filter(estLivraison)
    setCommandes(
      livraisons
        .filter((c) => STATUTS_LIVREUR.includes(c.statut))
        .sort((a, b) => new Date(a.creeLe) - new Date(b.creeLe)),
    )
    setLivrees(livraisons.filter((c) => c.statut === 'LIVREE'))
  }, [])

  // Detecte les commandes nouvellement passees en EN_LIVRAISON (equivalent
  // livreur de la detection des nouvelles PAYEE cote Cuisine, voir
  // useCuisineBoard.js) — toujours sur la reponse API brute, jamais sur la
  // liste substituee par la demo.
  const detecterNouvelles = useCallback((data) => {
    const liste = Array.isArray(data) ? data : []
    const enLivraison = liste.filter((c) => c.statut === 'EN_LIVRAISON' && estLivraison(c))
    if (idsEnLivraisonConnus.current) {
      const arrivees = enLivraison.filter((c) => !idsEnLivraisonConnus.current.has(c.id))
      if (arrivees.length > 0) setNouvelleAlerte({ commandes: arrivees, at: Date.now() })
    }
    idsEnLivraisonConnus.current = new Set(enLivraison.map((c) => c.id))
  }, [])

  const charger = useCallback(async () => {
    const version = mutationVersion.current
    try {
      const data = await apiGet('/commandes')
      if (version !== mutationVersion.current) return
      detecterNouvelles(data)
      const { commandes: liste, demo: isDemo } = avecDemoSiVide(data)
      apply(liste, isDemo)
      setError(null)
    } catch (err) {
      if (version !== mutationVersion.current) return
      const { commandes: liste, demo: isDemo } = avecDemoSiVide([])
      apply(liste, isDemo)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apply, detecterNouvelles])

  useEffect(() => {
    charger()
    const timer = setInterval(charger, REFRESH_MS)
    return () => clearInterval(timer)
  }, [charger])

  useEffect(() => {
    apiGet('/produits')
      .then((liste) => setProduits(mergeProduitsDemo(mapProduitsParId(liste))))
      .catch(() => setProduits(mergeProduitsDemo({})))
  }, [])

  async function changerStatut(commande, statut) {
    setPendingId(commande.id)
    setError(null)
    try {
      if (isDemoId(commande.id)) {
        patchDemoStatut(commande.id, statut)
        mutationVersion.current += 1
        apply(getDemoCommandes(), true)
        return
      }
      const maj = await apiPatch(`/commandes/${commande.id}/statut`, { statut })
      mutationVersion.current += 1
      // Recombine les deux listes suivies ici (actives + livrees) avant de
      // reappliquer le filtre commun — pas de second GET, meme approche que
      // useCuisineBoard.changerStatut.
      apply([...commandes, ...livrees].map((c) => (c.id === commande.id ? maj : c)), demo)
    } catch (err) {
      setError(
        err.status === 403
          ? `Action refusée pour « ${STATUT_LABELS[statut]} ».`
          : err.message,
      )
    } finally {
      setPendingId(null)
    }
  }

  return {
    role,
    commandes,
    livrees,
    produits,
    loading,
    error,
    demo,
    pendingId,
    nouvelleAlerte,
    charger,
    changerStatut,
    clearAlerte: () => setNouvelleAlerte(null),
  }
}
