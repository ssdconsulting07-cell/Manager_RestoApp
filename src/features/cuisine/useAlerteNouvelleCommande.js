import { useEffect, useMemo } from 'react'
import { jouerAlerteSonore } from './cuisineUtils.js'

// Partage entre Commandes.jsx et CuisineDashboard.jsx : les deux ecrans
// jouent le meme bip et affichent le meme toast quand useCuisineBoard signale
// une nouvelle commande payee (retour utilisateur : le personnel ne doit pas
// avoir a fixer l'ecran en continu pour ne rien manquer, quel que soit celui
// des deux ecrans ouvert). nouvelleAlerte ne change d'identite que lorsqu'une
// nouvelle commande arrive reellement (voir useCuisineBoard) : useMemo evite
// de reconstruire un objet toast different a chaque re-rendu, ce qui aurait
// sans cesse relance le minuteur d'auto-fermeture du Toast. Le bip est joue a
// part, dans un useEffect (useMemo doit rester pur, sans effet de bord —
// React peut l'invoquer plus d'une fois par rendu, ex. StrictMode).
export function useAlerteNouvelleCommande(nouvelleAlerte) {
  const toast = useMemo(() => {
    if (!nouvelleAlerte) return null
    const n = nouvelleAlerte.commandes.length
    return {
      id: nouvelleAlerte.at,
      type: 'info',
      message:
        n === 1
          ? `Nouvelle commande reçue — #${String(nouvelleAlerte.commandes[0].id).replace(/^demo-/, '')}`
          : `${n} nouvelles commandes reçues`,
    }
  }, [nouvelleAlerte])

  useEffect(() => {
    if (nouvelleAlerte) jouerAlerteSonore()
  }, [nouvelleAlerte])

  return toast
}
