// Filtres du Journal d'audit, partages par la liste a l'ecran et l'export :
// l'export reprend exactement les filtres actifs, bornes par une periode.
import { ROLE_LABELS } from '../../auth/roles.js'
import { DOMAINES_AUDIT } from './auditData.js'

export const TOUS = 'TOUS'

// Recherche insensible a la casse et aux accents (« prete » trouve « prête »).
function normaliser(texte) {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filtrerJournal(entrees, { role = TOUS, domaine = TOUS, recherche = '' }) {
  const termes = normaliser(recherche.trim()).split(/\s+/).filter(Boolean)
  return entrees.filter((entree) => {
    if (role !== TOUS && entree.acteur.role !== role) return false
    if (domaine !== TOUS && entree.domaine !== domaine) return false
    if (!termes.length) return true
    const texte = normaliser([
      entree.acteur.nom, entree.action, ROLE_LABELS[entree.acteur.role], DOMAINES_AUDIT[entree.domaine].label,
    ].join(' '))
    return termes.every((terme) => texte.includes(terme))
  })
}

// Dates au format des champs <input type="date"> (AAAA-MM-JJ), en heure locale.
function debutDuJour(valeur) {
  const [a, m, j] = valeur.split('-').map(Number)
  return new Date(a, m - 1, j, 0, 0, 0, 0)
}

function finDuJour(valeur) {
  const [a, m, j] = valeur.split('-').map(Number)
  return new Date(a, m - 1, j, 23, 59, 59, 999)
}

export function erreurPeriode({ debut, fin }) {
  if (debut && fin && fin < debut) return 'La date de fin doit être postérieure ou égale à la date de début.'
  return null
}

// Bornes incluses : la date de fin couvre toute la journee.
export function filtrerParPeriode(entrees, { debut, fin }) {
  const min = debut ? debutDuJour(debut) : null
  const max = fin ? finDuJour(fin) : null
  return entrees.filter((entree) => {
    const date = new Date(entree.createdAt)
    return (!min || date >= min) && (!max || date <= max)
  })
}

export function libellesFiltres({ role = TOUS, domaine = TOUS, recherche = '' }) {
  return {
    role: role === TOUS ? 'Tous les rôles' : ROLE_LABELS[role],
    domaine: domaine === TOUS ? 'Tous les types' : DOMAINES_AUDIT[domaine].label,
    recherche: recherche.trim() ? `« ${recherche.trim()} »` : 'Aucune',
  }
}

export function libellePeriode({ debut, fin }) {
  const format = (valeur) => debutDuJour(valeur).toLocaleDateString('fr-FR')
  if (debut && fin) return `Du ${format(debut)} au ${format(fin)}`
  if (debut) return `Depuis le ${format(debut)}`
  if (fin) return `Jusqu’au ${format(fin)}`
  return 'Toute la période'
}

export function nomFichierExport({ debut, fin }, maintenant = new Date()) {
  const jour = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  if (debut && fin) return `journal-audit_${debut}_au_${fin}.xlsx`
  if (debut) return `journal-audit_depuis_${debut}.xlsx`
  if (fin) return `journal-audit_jusqu-au_${fin}.xlsx`
  return `journal-audit_complet_${jour(maintenant)}.xlsx`
}

// Colonnes de l'export : Date/heure, Employe, Role, Type d'action, Description.
export function lignesExport(entrees) {
  return entrees.map((entree) => ({
    date: new Date(entree.createdAt),
    employe: entree.acteur.nom,
    role: ROLE_LABELS[entree.acteur.role],
    type: DOMAINES_AUDIT[entree.domaine].label,
    description: entree.action,
  }))
}
