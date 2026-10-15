import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPatch } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { STATUT_LABELS } from '../../auth/transitions.js'
import { avecDemoSiVide, getDemoCommandes, isDemoId, mergeProduitsDemo, patchDemoStatut } from './cuisineDemo.js'
import { REFRESH_MS, filtrerParStatuts, mapProduitsParId } from './cuisineUtils.js'

// Les 3 statuts geres par le poste cuisine, dans l'ordre du flux.
const STATUTS_CUISINE = ['PAYEE', 'EN_PREPARATION', 'PRETE']

/**
 * Charge / rafraichit les commandes cuisine pour le tableau unique a 3
 * colonnes (Recues / En preparation / Pretes) — retour utilisateur sur
 * l'ancien decoupage en 2 pages (Commandes.jsx / Preparation.jsx) qui
 * obligeait a changer d'ecran pour suivre un seul ticket, et qui ne
 * montrait nulle part les commandes PRETE (elles disparaissaient purement
 * et simplement de la vue une fois marquees pretes).
 *
 * Branche deja : GET /commandes, GET /produits, PATCH /commandes/:id/statut.
 * La demo ne s'active que si aucune commande active n'arrive (voir
 * avecDemoSiVide dans cuisineDemo.js).
 */
export function useCuisineBoard() {
  const { role } = useAuth()
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demo, setDemo] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [nouvelleAlerte, setNouvelleAlerte] = useState(null)
  const mutationVersion = useRef(0)
  // null = aucune reponse reelle de l'API encore recue (1er chargement, ou
  // chaque tentative depuis a echoue) — sert a ignorer l'alerte tant qu'on
  // n'a pas une base reelle a laquelle comparer.
  const idsPayeesConnus = useRef(null)

  const apply = useCallback((liste, isDemo) => {
    setDemo(isDemo)
    setCommandes(filtrerParStatuts(liste, STATUTS_CUISINE))
  }, [])

  // Detecte les commandes PAYEE nouvellement arrivees, toujours sur la
  // reponse BRUTE de l'API (jamais sur la liste apres substitution par la
  // demo, et jamais appelee du tout cote demo — voir changerStatut) : bug
  // corrige, une 1ere comparaison basee sur la liste substituee faisait
  // passer a tort pour "non comparable" le chargement reel qui suit une
  // cuisine vide (donc affichant la demo juste avant), et la toute premiere
  // vraie commande d'une cuisine qui se reveille passait alors inaperçue —
  // exactement le moment ou l'alerte sert le plus. En comparant toujours la
  // reponse API brute (vide ou non) a la precedente reponse API brute
  // connue, ce cas redevient une "nouvelle commande" normale.
  const detecterNouvelles = useCallback((data) => {
    const liste = Array.isArray(data) ? data : []
    const payees = liste.filter((c) => c.statut === 'PAYEE')
    if (idsPayeesConnus.current) {
      const arrivees = payees.filter((c) => !idsPayeesConnus.current.has(c.id))
      if (arrivees.length > 0) setNouvelleAlerte({ commandes: arrivees, at: Date.now() })
    }
    idsPayeesConnus.current = new Set(payees.map((c) => c.id))
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
      // Erreur reseau : on ne sait rien de l'etat reel, donc idsPayeesConnus
      // n'est pas touche ici — au retour du reseau, la comparaison se fera
      // contre la derniere reponse reelle connue avant la coupure, et toute
      // commande arrivee pendant la coupure sera bien signalee (voulu).
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
      setCommandes((prev) =>
        filtrerParStatuts(prev.map((c) => (c.id === commande.id ? maj : c)), STATUTS_CUISINE),
      )
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
