import { createContext, useContext, useMemo } from 'react'
import { CHAINES_INITIALES } from './annonceData.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import useRessourceApi, { imageEnvoyee } from '../../hooks/useRessourceApi.js'

// Chaines d'annonces partagees entre la page de gestion, le tableau de bord
// et l'apercu cote client. Donnees servies par l'API /annonces (toutes pour
// le Gerant et le Manager).
//
// source="memoire" : donnees de demonstration locales (tests).
const AnnoncesContext = createContext(null)

const ROLES = ['GERANT', 'MANAGER']

// Images des slides recadrees dans le navigateur : envoyees sur POST /photos.
async function slidesEnvoyees(data) {
  if (!Array.isArray(data?.slides)) return data
  const slides = await Promise.all(
    data.slides.map(async ({ titre, message, imageUrl }) => ({ titre, message, imageUrl: await imageEnvoyee(imageUrl) })),
  )
  return { ...data, slides }
}

export function AnnoncesProvider({ children, source = 'api' }) {
  const { role } = useAuth()
  const ressource = useRessourceApi({
    chemin: '/annonces',
    initial: CHAINES_INITIALES,
    source,
    actif: ROLES.includes(role),
    libelle: 'L’enregistrement de l’annonce',
    preparer: slidesEnvoyees,
  })
  const chaines = ressource.items

  const chainesActives = useMemo(
    () => chaines
      .filter((chaine) => chaine.statut === 'ACTIF')
      .sort((a, b) => new Date(a.publishedAt || a.updatedAt) - new Date(b.publishedAt || b.updatedAt)),
    [chaines],
  )

  // publishedAt est renouvele par le serveur a chaque (re)publication : l'App
  // Client reaffiche alors l'annonce aux clients qui l'avaient deja vue.
  function majStatutChaine(id, statut) {
    if (ressource.enMemoire) {
      const maintenant = new Date().toISOString()
      ressource.setItems((prev) => prev.map((c) => (
        c.id === id ? { ...c, statut, publishedAt: statut === 'ACTIF' ? maintenant : null, updatedAt: maintenant } : c
      )))
      return undefined
    }
    return ressource.majStatut(id, statut)
  }

  // Le serveur ne supprime jamais une fiche : "supprimer" = archiver.
  function supprimerChaine(id) {
    if (ressource.enMemoire) {
      ressource.setItems((prev) => prev.filter((c) => c.id !== id))
      return undefined
    }
    const chaine = chaines.find((c) => c.id === id)
    return chaine?.statut === 'ARCHIVE' ? undefined : ressource.majStatut(id, 'ARCHIVE')
  }

  const value = {
    chaines,
    chainesActives,
    chargement: ressource.chargement,
    erreur: ressource.erreur,
    recharger: ressource.recharger,
    creerChaine: ressource.creer,
    modifierChaine: ressource.modifier,
    publierChaine: (id) => majStatutChaine(id, 'ACTIF'),
    majStatutChaine,
    supprimerChaine,
  }

  return <AnnoncesContext.Provider value={value}>{children}</AnnoncesContext.Provider>
}

export function useAnnonces() {
  return useContext(AnnoncesContext)
}
