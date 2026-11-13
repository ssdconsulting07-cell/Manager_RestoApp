import { createContext, useContext, useMemo } from 'react'
import { CATEGORIES_INITIALES, PRODUITS_INITIAUX } from './menuData.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useRessourceApi from '../../hooks/useRessourceApi.js'

// Menu (categories et produits) partage entre les pages Produits, Categories,
// Apercu client et la caisse (Vente). Donnees servies par l'API :
// GET /categories et /produits (tout pour le Gerant et le Manager, seulement
// le publie pour les autres roles), ecriture reservee au Gerant.
//
// source="memoire" : donnees de demonstration locales (tests).
const MenuDataContext = createContext(null)

const ROLES_MENU = ['GERANT', 'MANAGER', 'VENDEUR']

export function MenuDataProvider({ children, source = 'api' }) {
  const { role } = useAuth()
  const actif = ROLES_MENU.includes(role)
  const cats = useRessourceApi({ chemin: '/categories', initial: CATEGORIES_INITIALES, source, actif, libelle: 'L’enregistrement de la catégorie' })
  const prods = useRessourceApi({ chemin: '/produits', initial: PRODUITS_INITIAUX, source, actif, libelle: 'L’enregistrement du produit' })
  const categories = cats.items
  const produits = prods.items

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
    return prods.majStatut(id, statut)
  }

  function toggleDisponibiliteProduit(id) {
    const produit = produits.find((p) => p.id === id)
    if (!produit) return undefined
    return prods.modifier(id, { disponibilite: produit.disponibilite === 'EN_STOCK' ? 'RUPTURE' : 'EN_STOCK' })
  }

  function toggleMiseEnAvantProduit(id, miseEnAvant) {
    if (!['tendance'].includes(miseEnAvant)) return undefined
    const produit = produits.find((p) => p.id === id)
    if (!produit) return undefined
    return prods.modifier(id, { [miseEnAvant]: !produit[miseEnAvant] })
  }

  function creerProduit(data) {
    return prods.creer(data)
  }

  function modifierProduit(id, data) {
    return prods.modifier(id, data)
  }

  // Le serveur ne supprime jamais une fiche (historique des commandes,
  // journal d'audit) : "supprimer" un produit = l'archiver (restaurable).
  function supprimerProduit(id) {
    if (prods.enMemoire) {
      prods.setItems((prev) => prev.filter((p) => p.id !== id))
      return undefined
    }
    const produit = produits.find((p) => p.id === id)
    return produit?.statut === 'ARCHIVE' ? undefined : prods.majStatut(id, 'ARCHIVE')
  }

  function majStatutCategorie(id, statut) {
    return cats.majStatut(id, statut)
  }

  function creerCategorie(data) {
    return cats.creer(data)
  }

  function modifierCategorie(id, data) {
    return cats.modifier(id, data)
  }

  // Categorie non vide : ses produits passent dans la categorie cible, puis
  // elle est archivee (une seule operation cote serveur, reassignerVers).
  async function reaffecterEtSupprimerCategorie(categorieId, targetId) {
    if (cats.enMemoire) {
      prods.setItems((prev) => prev.map((p) => (p.categorieId === categorieId ? { ...p, categorieId: targetId } : p)))
      cats.setItems((prev) => prev.filter((c) => c.id !== categorieId))
      return
    }
    prods.setItems((prev) => prev.map((p) => (p.categorieId === categorieId ? { ...p, categorieId: targetId } : p)))
    await cats.majStatut(categorieId, 'ARCHIVE', { reassignerVers: targetId })
    await prods.recharger()
  }

  function supprimerCategorie(id) {
    if (cats.enMemoire) {
      cats.setItems((prev) => prev.filter((c) => c.id !== id))
      return undefined
    }
    return cats.majStatut(id, 'ARCHIVE')
  }

  const value = {
    categories,
    produits,
    chargement: cats.chargement || prods.chargement,
    erreur: cats.erreur || prods.erreur,
    recharger: () => Promise.all([cats.recharger(), prods.recharger()]),
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
