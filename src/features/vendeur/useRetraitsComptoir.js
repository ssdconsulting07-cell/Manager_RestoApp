import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../../api/client.js'
import { avecDemoSiVide, isDemoId, mergeProduitsDemo, patchDemoStatut } from '../cuisine/cuisineDemo.js'
import { mapProduitsParId, REFRESH_MS } from '../cuisine/cuisineUtils.js'

/** Commandes comptoir (canal COMPTOIR, mode RETRAIT — voir
 * commandeComptoir.js) cote caisse : memes donnees que le tableau Cuisine
 * (useCuisineBoard.js, meme store demo partage), mais filtrees pour ne
 * garder que celles que la caisse doit remettre au client, pas celles que
 * la Cuisine prepare encore. Decision du 16/10/2026 (audit de coherence
 * des flux, point 3) : c'est la caisse qui declenche PRETE -> RETIREE
 * (transitions.js), pas la Cuisine ni le Livreur. */
export function useRetraitsComptoir() {
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState({})
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState(null)

  const appliquer = useCallback((liste) => {
    setCommandes(liste.filter((c) => c.canal === 'COMPTOIR' && c.mode === 'RETRAIT' && c.statut === 'PRETE'))
  }, [])

  const charger = useCallback(async () => {
    try {
      const data = await apiGet('/commandes')
      appliquer(avecDemoSiVide(data).commandes)
    } catch {
      appliquer(avecDemoSiVide([]).commandes)
    }
  }, [appliquer])

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

  async function remettreAuClient(commande) {
    setPendingId(commande.id)
    setError(null)
    try {
      if (isDemoId(commande.id)) {
        patchDemoStatut(commande.id, 'RETIREE')
      } else {
        await apiPatch(`/commandes/${commande.id}/statut`, { statut: 'RETIREE' })
      }
      await charger()
    } catch (err) {
      setError(err.message)
    } finally {
      setPendingId(null)
    }
  }

  return { commandes, produits, pendingId, error, remettreAuClient }
}
