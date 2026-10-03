import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPatch } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { STATUT_LABELS } from '../../auth/transitions.js'
import { avecDemoSiVide, getDemoCommandes, isDemoId, mergeProduitsDemo, patchDemoStatut } from './cuisineDemo.js'
import { REFRESH_MS, filtrerParStatuts, mapProduitsParId } from './cuisineUtils.js'

/**
 * Charge / rafraichit les commandes cuisine.
 * Branche deja : GET /commandes, GET /produits, PATCH /commandes/:id/statut.
 * La demo ne s'active que si aucune commande PAYEE / EN_PREPARATION n'arrive.
 */
export function useCuisineBoard({ primaryStatuts, secondaryStatut }) {
  const { role } = useAuth()
  const [items, setItems] = useState([])
  const [sideCount, setSideCount] = useState(0)
  const [produits, setProduits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demo, setDemo] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const mutationVersion = useRef(0)

  const primaryKey = primaryStatuts.join('|')

  const apply = useCallback(
    (liste, isDemo) => {
      setDemo(isDemo)
      setItems(filtrerParStatuts(liste, primaryStatuts))
      setSideCount(liste.filter((c) => c.statut === secondaryStatut).length)
    },
    // primaryStatuts est un tableau constant cote appelant ; on depend de sa cle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryKey, secondaryStatut],
  )

  const charger = useCallback(async () => {
    const version = mutationVersion.current
    try {
      const data = await apiGet('/commandes')
      if (version !== mutationVersion.current) return
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
  }, [apply])

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
      setItems((prev) => filtrerParStatuts(prev.map((c) => (c.id === commande.id ? maj : c)), primaryStatuts))
      if (maj.statut === secondaryStatut) setSideCount((n) => n + 1)
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

  return { role, items, sideCount, produits, loading, error, demo, pendingId, charger, changerStatut }
}
