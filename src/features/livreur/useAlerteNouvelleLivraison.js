import { useEffect, useMemo } from 'react'
import { jouerAlerteSonore, ticketId } from '../cuisine/cuisineUtils.js'

// Equivalent livreur de useAlerteNouvelleCommande.js (Cuisine) : meme bip,
// meme mecanique (useMemo pur + useEffect pour l'effet de bord), mais sur
// l'arrivee d'une commande EN_LIVRAISON (confiee par la cuisine) plutot
// qu'une commande PAYEE — voir useLivreurBoard.js.
export function useAlerteNouvelleLivraison(nouvelleAlerte) {
  const toast = useMemo(() => {
    if (!nouvelleAlerte) return null
    const n = nouvelleAlerte.commandes.length
    return {
      id: nouvelleAlerte.at,
      type: 'info',
      message:
        n === 1
          ? `Nouvelle livraison à prendre en charge — #${ticketId(nouvelleAlerte.commandes[0])}`
          : `${n} nouvelles livraisons à prendre en charge`,
    }
  }, [nouvelleAlerte])

  useEffect(() => {
    if (nouvelleAlerte) jouerAlerteSonore()
  }, [nouvelleAlerte])

  return toast
}
