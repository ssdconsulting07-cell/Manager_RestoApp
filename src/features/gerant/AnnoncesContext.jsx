import { createContext, useContext, useMemo, useState } from 'react'
import { ANNONCES_INITIALES, createAnnonceId } from './annonceData.js'

// Sur le modele de MenuDataContext : partage les annonces (mock) entre la
// page Annonces et l'Apercu client (qui affiche l'annonce active comme le
// ferait l'app Client au lancement).
const AnnoncesContext = createContext(null)

export function AnnoncesProvider({ children }) {
  const [annonces, setAnnonces] = useState(ANNONCES_INITIALES)

  const annonceActive = useMemo(
    () => annonces.find((a) => a.statut === 'ACTIF') || null,
    [annonces],
  )

  function creerAnnonce(data) {
    const nouvelle = { id: createAnnonceId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
    setAnnonces((prev) => [nouvelle, ...prev])
    return nouvelle
  }

  function modifierAnnonce(id, data) {
    setAnnonces((prev) => prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a)))
  }

  // Une seule annonce active a la fois (popup unique a l'arrivee sur l'app
  // Client) : publier celle-ci depublie automatiquement toute autre annonce
  // actuellement ACTIF.
  function publierAnnonce(id) {
    const maintenant = new Date().toISOString()
    setAnnonces((prev) => prev.map((a) => {
      if (a.id === id) return { ...a, statut: 'ACTIF', updatedAt: maintenant }
      if (a.statut === 'ACTIF') return { ...a, statut: 'BROUILLON', updatedAt: maintenant }
      return a
    }))
  }

  function majStatutAnnonce(id, statut) {
    setAnnonces((prev) => prev.map((a) => (a.id === id ? { ...a, statut, updatedAt: new Date().toISOString() } : a)))
  }

  function supprimerAnnonce(id) {
    setAnnonces((prev) => prev.filter((a) => a.id !== id))
  }

  const value = {
    annonces,
    annonceActive,
    creerAnnonce,
    modifierAnnonce,
    publierAnnonce,
    majStatutAnnonce,
    supprimerAnnonce,
  }

  return <AnnoncesContext.Provider value={value}>{children}</AnnoncesContext.Provider>
}

export function useAnnonces() {
  return useContext(AnnoncesContext)
}
