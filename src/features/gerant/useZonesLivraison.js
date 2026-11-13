import { useCallback, useEffect, useRef, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../api/client.js'
import { signalerErreurApi } from '../../utils/alertes.js'
import {
  activerRegion as activerMemoire,
  ajouterZone as ajouterMemoire,
  arrondissementsDe as arrondissementsMemoire,
  definirPrix as definirPrixMemoire,
  desactiverRegion as desactiverMemoire,
  prixDe as prixMemoire,
  regionsActives as activesMemoire,
  supprimerZone as supprimerMemoire,
} from './zonesLivraisonData.js'

// Zones de livraison du Gerant. Meme interface pour deux sources :
// - 'api' : GET /regions et /regions/{code}/secteurs (masquees comprises
//   pour le Gerant), PATCH /regions/{code} (ouvrir/fermer), PUT
//   /secteurs/{id} (prix, enregistre 0,7 s apres la derniere frappe),
//   POST /regions/{code}/secteurs (zone ajoutee a la main), et pour
//   retirer une zone : PATCH /secteurs/{id}/masque (arrondissement officiel,
//   jamais supprime) ou DELETE /secteurs/{id} (zone ajoutee a la main) ;
// - 'memoire' : donnees locales (tests, demonstration).
const DELAI_PRIX_MS = 700

export default function useZonesLivraison(source = 'api') {
  const enMemoire = source === 'memoire'
  const [regions, setRegions] = useState([])
  const [secteurs, setSecteurs] = useState({}) // code region -> SecteurVue[]
  const [revision, setRevision] = useState(0) // source memoire : force le rendu
  const secteursRef = useRef(secteurs)
  const minuteries = useRef(new Map())

  const majSecteurs = useCallback((code, fn) => {
    setSecteurs((prev) => {
      const suivant = { ...prev, [code]: fn(prev[code] || []) }
      secteursRef.current = suivant
      return suivant
    })
  }, [])

  const chargerRegions = useCallback(async () => {
    if (enMemoire) return
    try {
      const liste = await apiGet('/regions')
      setRegions(liste)
      // Zones de toutes les regions : resume des regions ouvertes et
      // nombre d'arrondissements annonce avant d'ouvrir une region.
      await Promise.all(liste.map(async (r) => {
        const zonesRegion = await apiGet(`/regions/${encodeURIComponent(r.id)}/secteurs`)
        majSecteurs(r.id, () => zonesRegion)
      }))
    } catch (err) {
      signalerErreurApi(err, 'Le chargement des régions')
    }
  }, [enMemoire, majSecteurs])

  const chargerSecteurs = useCallback(async (code) => {
    if (enMemoire || !code) return
    try {
      const liste = await apiGet(`/regions/${encodeURIComponent(code)}/secteurs`)
      majSecteurs(code, () => liste)
    } catch (err) {
      signalerErreurApi(err, 'Le chargement des zones')
    }
  }, [enMemoire, majSecteurs])

  useEffect(() => {
    chargerRegions()
  }, [chargerRegions])

  useEffect(() => () => minuteries.current.forEach((t) => clearTimeout(t)), [])

  const echec = (err, code) => {
    signalerErreurApi(err, 'L’enregistrement de la zone')
    chargerRegions()
    if (code) chargerSecteurs(code)
  }

  if (enMemoire) {
    const toucher = () => setRevision((v) => v + 1)
    return {
      revision,
      actives: activesMemoire(),
      chargerSecteurs: () => {},
      activer: (code) => { activerMemoire(code); toucher() },
      desactiver: (code) => { desactiverMemoire(code); toucher() },
      arrondissementsDe: arrondissementsMemoire,
      prixDe: prixMemoire,
      definirPrix: (code, nom, prix) => { definirPrixMemoire(code, nom, prix); toucher() },
      ajouter: (code, departement, nom) => { ajouterMemoire(code, departement, nom); toucher() },
      retirer: (code, nom) => { supprimerMemoire(code, nom); toucher() },
    }
  }

  const visibles = (code) => (secteurs[code] || []).filter((s) => !s.estMasque)

  async function basculerRegion(code, active) {
    const region = regions.find((r) => r.id === code)
    setRegions((prev) => prev.map((r) => (r.id === code ? { ...r, active } : r)))
    try {
      const maj = await apiPatch(`/regions/${encodeURIComponent(code)}`, { active, version: region?.version })
      setRegions((prev) => prev.map((r) => (r.id === code ? maj : r)))
      if (active) chargerSecteurs(code)
    } catch (err) {
      echec(err, code)
    }
  }

  function definirPrix(code, nom, prix) {
    const secteur = (secteursRef.current[code] || []).find((s) => s.nom === nom && !s.estMasque)
    if (!secteur) return
    majSecteurs(code, (liste) => liste.map((s) => (s.id === secteur.id ? { ...s, prixLivraison: prix } : s)))
    clearTimeout(minuteries.current.get(secteur.id))
    minuteries.current.set(secteur.id, setTimeout(async () => {
      minuteries.current.delete(secteur.id)
      const actuel = (secteursRef.current[code] || []).find((s) => s.id === secteur.id)
      try {
        const maj = await apiPut(`/secteurs/${encodeURIComponent(secteur.id)}`, {
          departement: actuel.departement,
          nom: actuel.nom,
          prixLivraison: actuel.prixLivraison,
          version: actuel.version,
        })
        // Version du serveur, mais le prix en cours de saisie reste celui de l'ecran.
        majSecteurs(code, (liste) => liste.map((s) => (s.id === maj.id ? { ...maj, prixLivraison: s.prixLivraison } : s)))
      } catch (err) {
        echec(err, code)
      }
    }, DELAI_PRIX_MS))
  }

  async function ajouter(code, departement, nom) {
    try {
      const cree = await apiPost(`/regions/${encodeURIComponent(code)}/secteurs`, { departement, nom, prixLivraison: 1000 })
      majSecteurs(code, (liste) => [...liste, cree])
    } catch (err) {
      echec(err, code)
    }
  }

  async function retirer(code, nom) {
    const secteur = visibles(code).find((s) => s.nom === nom)
    if (!secteur) return
    majSecteurs(code, (liste) => liste.map((s) => (s.id === secteur.id ? { ...s, estMasque: true } : s)))
    try {
      if (secteur.estOfficiel) {
        const maj = await apiPatch(`/secteurs/${encodeURIComponent(secteur.id)}/masque`, { estMasque: true, version: secteur.version })
        majSecteurs(code, (liste) => liste.map((s) => (s.id === maj.id ? maj : s)))
      } else {
        await apiDelete(`/secteurs/${encodeURIComponent(secteur.id)}`)
        majSecteurs(code, (liste) => liste.filter((s) => s.id !== secteur.id))
      }
    } catch (err) {
      echec(err, code)
    }
  }

  return {
    revision: 0,
    actives: regions.filter((r) => r.active).map((r) => r.id),
    chargerSecteurs,
    activer: (code) => basculerRegion(code, true),
    desactiver: (code) => basculerRegion(code, false),
    arrondissementsDe: (code) => visibles(code).map((s) => ({ departement: s.departement, nom: s.nom, estOfficiel: s.estOfficiel })),
    prixDe: (code) => Object.fromEntries(visibles(code).map((s) => [s.nom, s.prixLivraison])),
    definirPrix,
    ajouter,
    retirer,
  }
}
