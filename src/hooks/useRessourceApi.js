import { useCallback, useEffect, useRef, useState } from 'react'
import { apiEnvoyerFichier, apiGet, apiPatch, apiPost, apiPut } from '../api/client.js'
import { signalerErreurApi } from '../utils/alertes.js'

// Liste de fiches du Gerant synchronisee avec l'API (categories, produits,
// plats du jour, accompagnements...) :
//
// - mise a jour IMMEDIATE de l'ecran (les ecrans affichent leur message de
//   succes tout de suite), puis enregistrement sur le serveur ; la fiche est
//   remplacee par la reponse du serveur (vrai identifiant, version, date) ;
// - verrouillage optimiste : chaque modification renvoie la `version` lue ;
//   si un collegue a modifie la fiche entre-temps, le serveur repond 409 au
//   lieu d'ecraser son travail ;
// - en cas de refus : alerte globale (utils/alertes.js) et rechargement de la
//   liste depuis le serveur (l'ecran revient a l'etat reel) ;
// - les operations sur une meme fiche sont executees l'une apres l'autre
//   (la version de l'une sert a la suivante) ;
// - photo : une image recadree localement (blob:/data:) est d'abord envoyee
//   sur POST /photos, puis son adresse est enregistree dans la fiche.
//
// source 'memoire' : donnees locales uniquement (tests, demonstration).
export default function useRessourceApi({
  chemin,
  initial = [],
  source = 'api',
  actif = true,
  libelle = 'L’enregistrement',
  // Transformation avant envoi (par defaut : envoi de la photo recadree).
  preparer = avecPhotoEnvoyee,
}) {
  const enMemoire = source === 'memoire'
  const [items, setItems] = useState(enMemoire ? initial : [])
  const [chargement, setChargement] = useState(!enMemoire && actif)
  const [erreur, setErreur] = useState(null)
  const itemsRef = useRef(items)
  const files = useRef(new Map()) // id -> promesse de la derniere operation
  const alias = useRef(new Map()) // identifiant provisoire -> identifiant serveur

  const appliquer = useCallback((maj) => {
    setItems((prev) => {
      const suivant = typeof maj === 'function' ? maj(prev) : maj
      itemsRef.current = suivant
      return suivant
    })
  }, [])

  const recharger = useCallback(async () => {
    if (enMemoire || !actif) return
    setChargement(true)
    try {
      const liste = await apiGet(chemin)
      appliquer(Array.isArray(liste) ? liste : [])
      setErreur(null)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setChargement(false)
    }
  }, [enMemoire, actif, chemin, appliquer])

  useEffect(() => {
    if (enMemoire) return
    if (!actif) {
      appliquer([])
      setChargement(false)
      return
    }
    recharger()
  }, [enMemoire, actif, recharger, appliquer])

  const idReel = (id) => alias.current.get(id) || id
  const trouver = (id) => itemsRef.current.find((i) => i.id === idReel(id))
  const remplacer = (id, fiche) => appliquer((prev) => prev.map((i) => (i.id === id ? fiche : i)))
  const maintenant = () => new Date().toISOString()

  // Execute fn apres la derniere operation en cours sur la meme fiche.
  const enFile = (id, fn) => {
    const precedente = files.current.get(id) || Promise.resolve()
    const suivante = precedente.then(fn, fn)
    files.current.set(id, suivante.catch(() => {}))
    return suivante
  }

  const echec = useCallback((err) => {
    signalerErreurApi(err, libelle)
    recharger()
  }, [libelle, recharger])

  const creer = useCallback((data) => {
    const provisoire = `provisoire-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const statutVoulu = data.statut
    const ficheProvisoire = { statut: 'BROUILLON', ...data, id: provisoire, updatedAt: maintenant() }
    appliquer((prev) => [ficheProvisoire, ...prev])
    if (enMemoire) return ficheProvisoire
    // Renvoie tout de suite la fiche provisoire (les ecrans enchainent parfois
    // "creer puis publier") : une operation demandee sur son identifiant
    // provisoire attend la fin de la creation, puis vise le vrai identifiant.
    enFile(provisoire, async () => {
      try {
        let fiche = await apiPost(chemin, await preparer(data))
        if (statutVoulu && statutVoulu !== fiche.statut) {
          fiche = await apiPatch(`${chemin}/${fiche.id}/statut`, { statut: statutVoulu, version: fiche.version })
        }
        alias.current.set(provisoire, fiche.id)
        remplacer(provisoire, fiche)
      } catch (err) {
        echec(err)
      }
    })
    return ficheProvisoire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enMemoire, chemin, appliquer, echec, preparer])

  const modifier = useCallback((id, data) => {
    appliquer((prev) => prev.map((i) => (i.id === idReel(id) ? { ...i, ...data, updatedAt: maintenant() } : i)))
    if (enMemoire) return Promise.resolve()
    return enFile(idReel(id), async () => {
      const cible = idReel(id)
      const avant = trouver(cible)
      try {
        // PUT = fiche complete : etat connu (eventuellement deja remplace par la
        // reponse d'une operation precedente) + champs modifies.
        const { statut, ...champs } = data
        const { id: _id, statut: _statut, updatedAt: _maj, version, ...connu } = avant || {}
        let fiche = await apiPut(`${chemin}/${cible}`, { ...(await preparer({ ...connu, ...champs })), version })
        if (statut && statut !== fiche.statut) {
          fiche = await apiPatch(`${chemin}/${cible}/statut`, { statut, version: fiche.version })
        }
        remplacer(cible, fiche)
      } catch (err) {
        echec(err)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enMemoire, chemin, appliquer, echec, preparer])

  const majStatut = useCallback((id, statut, extra = {}) => {
    appliquer((prev) => prev.map((i) => (i.id === idReel(id) ? { ...i, statut, updatedAt: maintenant() } : i)))
    if (enMemoire) return Promise.resolve()
    return enFile(idReel(id), async () => {
      const cible = idReel(id)
      try {
        const fiche = await apiPatch(`${chemin}/${cible}/statut`, { statut, version: trouver(cible)?.version, ...extra })
        remplacer(cible, fiche)
      } catch (err) {
        echec(err)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enMemoire, chemin, appliquer, echec, preparer])

  return { items, setItems: appliquer, chargement, erreur, recharger, creer, modifier, majStatut, enMemoire }
}

// Photo recadree dans le navigateur (blob: ou data:) : envoyee au serveur,
// qui la verifie, la redimensionne, retire ses metadonnees et renvoie son
// adresse definitive. Une adresse https deja enregistree est gardee telle quelle.
export async function avecPhotoEnvoyee(data) {
  return { ...data, photoUrl: await imageEnvoyee(data?.photoUrl) }
}

// Adresse definitive d'une image : envoyee sur POST /photos si elle n'existe
// encore que dans le navigateur (blob:/data:), gardee telle quelle sinon.
export async function imageEnvoyee(url) {
  if (!url || !(url.startsWith('blob:') || url.startsWith('data:'))) return url
  const fichier = await (await fetch(url)).blob()
  const extension = fichier.type === 'image/png' ? 'png' : 'jpg'
  const { url: definitive } = await apiEnvoyerFichier('/photos', 'fichier', fichier, `photo.${extension}`)
  return definitive
}
