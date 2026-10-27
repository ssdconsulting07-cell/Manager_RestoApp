import { createContext, useContext, useMemo, useState } from 'react'
import {
  ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX,
  createAccompagnementCondimentId,
} from './accompagnementsCondimentsData.js'

// Partage les fiches Accompagnements & condiments entre la page de gestion
// (Gerant, AccompagnementsCondiments.jsx) et la caisse (Vendeur, Vente.jsx) :
// sans ce contexte, un accompagnement cree/publie cote Gerant ne serait
// jamais visible a la caisse (meme raison que MenuDataContext.jsx).
const AccompagnementsCondimentsContext = createContext(null)

export function AccompagnementsCondimentsProvider({ children }) {
  const [items, setItems] = useState(ACCOMPAGNEMENTS_CONDIMENTS_INITIAUX)

  // Seules les fiches publiees (ACTIF) sont proposables a la caisse.
  const itemsActifs = useMemo(() => items.filter((i) => i.statut === 'ACTIF'), [items])

  function majStatut(id, statut) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, statut, updatedAt: new Date().toISOString() } : i)))
  }

  function creerItem(data) {
    const nouveau = { id: createAccompagnementCondimentId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
    setItems((prev) => [nouveau, ...prev])
    return nouveau
  }

  function modifierItem(id, data) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i)))
  }

  function supprimerItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const value = {
    items,
    itemsActifs,
    majStatut,
    creerItem,
    modifierItem,
    supprimerItem,
  }

  return <AccompagnementsCondimentsContext.Provider value={value}>{children}</AccompagnementsCondimentsContext.Provider>
}

export function useAccompagnementsCondiments() {
  return useContext(AccompagnementsCondimentsContext)
}
