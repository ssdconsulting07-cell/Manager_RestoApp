import { useEffect, useState } from 'react'
import { apiGet } from '../../api/client.js'
import { STATUTS_COMMANDE } from './commandesData.js'

// Donnees du Manager servies par l'API (journal d'audit, tableau de bord).

const JOURS_AUDIT = 92 // periode maximale acceptee par GET /audit
const TAILLE_PAGE = 200 // taille de page maximale
const MAX_ENTREES = 1000 // au-dela : filtrer par periode ou exporter

function isoJour(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Journal d'audit des 92 derniers jours (le plus recent d'abord). */
export function useJournalAudit() {
  const [etat, setEtat] = useState({ entrees: [], chargement: true, erreur: null })
  useEffect(() => {
    let annule = false
    ;(async () => {
      const du = new Date()
      du.setDate(du.getDate() - (JOURS_AUDIT - 1))
      const entrees = []
      try {
        for (let page = 0; entrees.length < MAX_ENTREES; page += 1) {
          const r = await apiGet(`/audit?du=${isoJour(du)}&au=${isoJour(new Date())}&page=${page}&taille=${TAILLE_PAGE}`)
          entrees.push(...(r?.entrees || []))
          if (!r?.entrees?.length || entrees.length >= (r.total ?? 0)) break
        }
        if (!annule) setEtat({ entrees, chargement: false, erreur: null })
      } catch (err) {
        if (!annule) setEtat({ entrees, chargement: false, erreur: err.message })
      }
    })()
    return () => { annule = true }
  }, [])
  return etat
}

function libelleJour(dateIso, estAujourdhui) {
  const date = new Date(`${dateIso}T12:00:00`)
  const jour = estAujourdhui ? 'auj' : date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
  return `${jour} ${date.getDate()}`
}

/** Tableau de bord : GET /statistiques/tableau-de-bord, au format des cartes. */
export function useTableauDeBord() {
  const vide = {
    finances: { jour: 0, semaine: 0, mois: 0, septJours: [] },
    commandes: { total: 0, encaissees: 0, counts: Object.fromEntries(Object.values(STATUTS_COMMANDE).map((s) => [s, 0])), panierMoyen: 0 },
  }
  const [etat, setEtat] = useState({ ...vide, chargement: true, erreur: null })
  useEffect(() => {
    let annule = false
    apiGet('/statistiques/tableau-de-bord')
      .then((t) => {
        if (annule) return
        const ca = t?.chiffreAffaires || {}
        const cmd = t?.commandesDuJour || {}
        const aujourdhui = t?.date
        setEtat({
          finances: {
            jour: ca.jour || 0,
            semaine: ca.semaine || 0,
            mois: ca.mois || 0,
            septJours: (ca.septDerniersJours || []).map((j) => ({ jour: libelleJour(j.date, j.date === aujourdhui), montant: j.montant })),
          },
          commandes: {
            total: cmd.total || 0,
            encaissees: cmd.encaissees || 0,
            counts: { ...vide.commandes.counts, ...(cmd.parStatut || {}) },
            panierMoyen: cmd.panierMoyen || 0,
          },
          chargement: false,
          erreur: null,
        })
      })
      .catch((err) => { if (!annule) setEtat((e) => ({ ...e, chargement: false, erreur: err.message })) })
    return () => { annule = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return etat
}
