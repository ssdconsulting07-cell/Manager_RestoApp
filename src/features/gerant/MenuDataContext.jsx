import { createContext, useContext, useMemo, useState } from 'react'
import {
  CATEGORIES_INITIALES,
  PRODUITS_INITIAUX,
  createProduitId,
  createCategorieId,
} from './menuData.js'

// Partage les donnees mock du menu (produits/categories) entre les pages
// Produits, Categories et Apercu client, qui sont desormais des routes
// independantes et non plus des onglets d'une seule page : sans ce contexte,
// chaque page perdrait les donnees des autres en changeant de route.
const MenuDataContext = createContext(null)

export function MenuDataProvider({ children }) {
  const [categories, setCategories] = useState(CATEGORIES_INITIALES)
  const [produits, setProduits] = useState(PRODUITS_INITIAUX)

  function categorieNomParId(id) {
    return categories.find((c) => c.id === id)?.nom || '—'
  }

  function produitsParCategorie(categorieId) {
    return produits.filter((p) => p.categorieId === categorieId)
  }

  const categoriesSelectionnables = useMemo(
    () => categories.filter((c) => c.statut !== 'ARCHIVE'),
    [categories],
  )

  function majStatutProduit(id, statut) {
    setProduits((prev) => prev.map((p) => (p.id === id ? { ...p, statut, updatedAt: new Date().toISOString() } : p)))
  }

  function toggleDisponibiliteProduit(id) {
    setProduits((prev) => prev.map((p) => (
      p.id === id
        ? { ...p, disponibilite: p.disponibilite === 'EN_STOCK' ? 'RUPTURE' : 'EN_STOCK', updatedAt: new Date().toISOString() }
        : p
    )))
  }

  function toggleMiseEnAvantProduit(id, miseEnAvant) {
    if (!['tendance', 'platDuJour'].includes(miseEnAvant)) return
    setProduits((prev) => prev.map((produit) => (
      produit.id === id
        ? { ...produit, [miseEnAvant]: !produit[miseEnAvant], updatedAt: new Date().toISOString() }
        : produit
    )))
  }

  function creerProduit(data) {
    const nouveau = { id: createProduitId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
    setProduits((prev) => [nouveau, ...prev])
    return nouveau
  }

  function modifierProduit(id, data) {
    setProduits((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)))
  }

  function supprimerProduit(id) {
    setProduits((prev) => prev.filter((p) => p.id !== id))
  }

  function majStatutCategorie(id, statut) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, statut, updatedAt: new Date().toISOString() } : c)))
  }

  function creerCategorie(data) {
    const nouvelle = { id: createCategorieId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
    setCategories((prev) => [nouvelle, ...prev])
    return nouvelle
  }

  function modifierCategorie(id, data) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c)))
  }

  function reaffecterEtSupprimerCategorie(categorieId, targetId) {
    setProduits((prev) => prev.map((p) => (p.categorieId === categorieId ? { ...p, categorieId: targetId } : p)))
    setCategories((prev) => prev.filter((c) => c.id !== categorieId))
  }

  function supprimerCategorie(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const value = {
    categories,
    produits,
    categorieNomParId,
    produitsParCategorie,
    categoriesSelectionnables,
    majStatutProduit,
    toggleDisponibiliteProduit,
    toggleMiseEnAvantProduit,
    creerProduit,
    modifierProduit,
    supprimerProduit,
    majStatutCategorie,
    creerCategorie,
    modifierCategorie,
    reaffecterEtSupprimerCategorie,
    supprimerCategorie,
  }

  return <MenuDataContext.Provider value={value}>{children}</MenuDataContext.Provider>
}

export function useMenuData() {
  return useContext(MenuDataContext)
}
