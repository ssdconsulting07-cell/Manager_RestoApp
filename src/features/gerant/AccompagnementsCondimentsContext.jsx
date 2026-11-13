import { createContext, useContext, useMemo } from 'react'
import { ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX } from './accompagnementsCondimentsData.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useRessourceApi from '../../hooks/useRessourceApi.js'

// Fiches Accompagnements & condiments partagees entre la page de gestion
// (Gerant, AccompagnementsCondiments.jsx) et la caisse (Vendeur, Vente.jsx).
// Donnees servies par l'API /accompagnements-condiments.
//
// source="memoire" : donnees de demonstration locales (tests).
const AccompagnementsCondimentsContext = createContext(null)

const ROLES = ['GERANT', 'MANAGER', 'VENDEUR']

export function AccompagnementsCondimentsProvider({ children, source = 'api' }) {
  const { role } = useAuth()
  const ressource = useRessourceApi({
    chemin: '/accompagnements-condiments',
    initial: ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX,
    source,
    actif: ROLES.includes(role),
    libelle: 'L’enregistrement de la fiche',
  })
  const { items } = ressource

  // Seules les fiches publiees (ACTIF) sont proposables a la caisse.
  const itemsActifs = useMemo(() => items.filter((i) => i.statut === 'ACTIF'), [items])

  // Le serveur ne supprime jamais une fiche : "supprimer" = archiver.
  function supprimerItem(id) {
    if (ressource.enMemoire) {
      ressource.setItems((prev) => prev.filter((i) => i.id !== id))
      return undefined
    }
    const item = items.find((i) => i.id === id)
    return item?.statut === 'ARCHIVE' ? undefined : ressource.majStatut(id, 'ARCHIVE')
  }

  const value = {
    items,
    itemsActifs,
    chargement: ressource.chargement,
    erreur: ressource.erreur,
    recharger: ressource.recharger,
    majStatut: ressource.majStatut,
    creerItem: ressource.creer,
    modifierItem: ressource.modifier,
    supprimerItem,
  }

  return <AccompagnementsCondimentsContext.Provider value={value}>{children}</AccompagnementsCondimentsContext.Provider>
}

export function useAccompagnementsCondiments() {
  return useContext(AccompagnementsCondimentsContext)
}
