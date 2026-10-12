import { createContext, useContext, useMemo, useState } from 'react'
import { CHAINES_INITIALES, createChaineId } from './annonceData.js'

// Donnees mock partagees entre la page de gestion et l'apercu cote client.
const AnnoncesContext = createContext(null)

export function AnnoncesProvider({ children }) {
  const [chaines, setChaines] = useState(CHAINES_INITIALES)

  const chainesActives = useMemo(
    () => chaines
      .filter((chaine) => chaine.statut === 'ACTIF')
      .sort((a, b) => new Date(a.publishedAt || a.updatedAt) - new Date(b.publishedAt || b.updatedAt)),
    [chaines],
  )

  function creerChaine(data) {
    const nouvelle = { id: createChaineId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
    setChaines((prev) => [nouvelle, ...prev])
    return nouvelle
  }

  function modifierChaine(id, data) {
    setChaines((prev) => prev.map((chaine) => (
      chaine.id === id ? { ...chaine, ...data, updatedAt: new Date().toISOString() } : chaine
    )))
  }

  function publierChaine(id) {
    const maintenant = new Date().toISOString()
    setChaines((prev) => prev.map((chaine) => (
      chaine.id === id
        ? { ...chaine, statut: 'ACTIF', publishedAt: maintenant, updatedAt: maintenant }
        : chaine
    )))
  }

  function majStatutChaine(id, statut) {
    const maintenant = new Date().toISOString()
    setChaines((prev) => prev.map((chaine) => (
      chaine.id === id
        ? { ...chaine, statut, publishedAt: statut === 'ACTIF' ? maintenant : null, updatedAt: maintenant }
        : chaine
    )))
  }

  function supprimerChaine(id) {
    setChaines((prev) => prev.filter((chaine) => chaine.id !== id))
  }

  const value = {
    chaines,
    chainesActives,
    creerChaine,
    modifierChaine,
    publierChaine,
    majStatutChaine,
    supprimerChaine,
  }

  return <AnnoncesContext.Provider value={value}>{children}</AnnoncesContext.Provider>
}

export function useAnnonces() {
  return useContext(AnnoncesContext)
}
