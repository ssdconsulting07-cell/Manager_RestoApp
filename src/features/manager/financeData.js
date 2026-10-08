// Chiffre d'affaires — MOCK en memoire en attendant le module Paiements du backend.
// Entrees uniquement (pas de depenses pour cette version). Le CA du jour vient
// des commandes encaissees du jour (commandesData.js) ; les jours passes sont
// generes de facon deterministe a partir de la date, pour rester stables d'un
// rechargement a l'autre.
import { commandesDuJour, commandesEncaissees } from './commandesData.js'

// Affluence relative par jour de semaine (0 = dimanche) : week-end plus charge.
const AFFLUENCE_JOUR = [1.25, 0.8, 0.85, 0.9, 0.95, 1.2, 1.35]
const CA_JOUR_MOYEN = 285000

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Variation pseudo-aleatoire stable entre 0.85 et 1.15, derivee de la date.
function variationStable(date) {
  const graine = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const x = Math.sin(graine) * 10000
  return 0.85 + (x - Math.floor(x)) * 0.3
}

export function caDuJour() {
  return commandesEncaissees(commandesDuJour).reduce((total, c) => total + c.montant, 0)
}

export function caPourDate(date, now = new Date()) {
  const jour = startOfDay(date)
  if (jour.getTime() === startOfDay(now).getTime()) return caDuJour()
  const brut = CA_JOUR_MOYEN * AFFLUENCE_JOUR[jour.getDay()] * variationStable(jour)
  return Math.round(brut / 100) * 100
}

function caEntre(debut, now) {
  let total = 0
  for (let jour = startOfDay(debut); jour <= startOfDay(now); jour = addDays(jour, 1)) {
    total += caPourDate(jour, now)
  }
  return total
}

// Semaine calendaire : depuis le lundi.
export function debutDeSemaine(now = new Date()) {
  const jour = startOfDay(now)
  const decalage = (jour.getDay() + 6) % 7
  return addDays(jour, -decalage)
}

export function debutDeMois(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function caDeLaSemaine(now = new Date()) {
  return caEntre(debutDeSemaine(now), now)
}

export function caDuMois(now = new Date()) {
  return caEntre(debutDeMois(now), now)
}

// Les 7 derniers jours, aujourd'hui inclus (le jour courant est partiel).
export function caSeptDerniersJours(now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(now), i - 6)
    return { date, estAujourdhui: i === 6, montant: caPourDate(date, now) }
  })
}
