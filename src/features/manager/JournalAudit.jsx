import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import { ROLE_LABELS } from '../../auth/roles.js'
import { DOMAINES_AUDIT, journalAudit } from './auditData.js'
import {
  TOUS, erreurPeriode, filtrerJournal, filtrerParPeriode, libellePeriode, libellesFiltres, nomFichierExport,
} from './journalAuditFiltres.js'
import { exporterJournalAudit } from './exportJournalAudit.js'

// Journal d’audit (Manager) : consultation seule de toutes les actions
// metier du personnel, UNE SOUS-PAGE PAR ROLE (retour utilisateur du
// 23/10/2026 : page trop chargee quand les 4 roles etaient melanges derriere
// un simple select) — voir Layout.jsx (dropdown sidebar, children) et
// App.jsx (route /journal-audit/:roleSlug). Le Manager n’a jamais sa
// propre sous-page ici (voir auditData.js : 0 action a son nom depuis le
// 16/10/2026).
export const ROLES_AUDIT = ['CUISINE', 'GERANT', 'LIVREUR', 'VENDEUR']

const SLUG_PAR_ROLE = { CUISINE: 'cuisine', GERANT: 'gerant', LIVREUR: 'livreur', VENDEUR: 'vendeur' }
const ROLE_PAR_SLUG = Object.fromEntries(Object.entries(SLUG_PAR_ROLE).map(([role, slug]) => [slug, role]))

export function roleDepuisSlug(slug) {
  return ROLE_PAR_SLUG[slug] ?? null
}

// Couleurs des cartes-filtre de domaine (StatFilterCards) : memes teintes que
// les cartes du tableau de bord Gerant/Manager (dashboard-stat-card) et le
// badge de statut cuisine (STATUT_META, voir cuisineUtils.js) — pas de
// nouvelle convention de couleur, sauf « Annonces » (violet), ce domaine
// n’ayant pas d’equivalent ailleurs dans l’appli.
const DOMAINE_ACCENTS = {
  COMMANDE: { accent: '#a6192e', accentBg: '#f8e9ec' },
  PRODUIT: { accent: '#2f6fed', accentBg: '#e8eefc' },
  CATEGORIE: { accent: '#9c6b0c', accentBg: '#f6ecd9' },
  ANNONCE: { accent: '#6a3fa0', accentBg: '#efe7f7' },
  PERSONNEL: { accent: '#1f6f57', accentBg: '#e2f2ec' },
}
const TOUTES_ACCENT = { accent: '#5b5b5f', accentBg: '#ececea' }

const ROWS_OPTIONS = [10, 25, 50]

function cleJour(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function libelleJour(date) {
  const aujourdhui = new Date()
  const hier = new Date(aujourdhui)
  hier.setDate(hier.getDate() - 1)
  const options = { weekday: 'long', day: 'numeric', month: 'long' }
  if (date.getFullYear() !== aujourdhui.getFullYear()) options.year = 'numeric'
  const jour = date.toLocaleDateString('fr-FR', options)
  if (cleJour(date) === cleJour(aujourdhui)) return `Aujourd’hui · ${jour}`
  if (cleJour(date) === cleJour(hier)) return `Hier · ${jour}`
  return jour.charAt(0).toUpperCase() + jour.slice(1)
}

function grouperParJour(entrees) {
  const groupes = []
  for (const entree of entrees) {
    const date = new Date(entree.createdAt)
    const cle = cleJour(date)
    if (groupes.at(-1)?.cle !== cle) groupes.push({ cle, libelle: libelleJour(date), entrees: [] })
    groupes.at(-1).entrees.push(entree)
  }
  return groupes
}

function aujourdhuiIso() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function ExportAuditModal({ entrees, filtres, onExported, onClose }) {
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [echec, setEchec] = useState(null)

  const periode = { debut, fin }
  const erreur = erreurPeriode(periode)
  const aExporter = erreur ? [] : filtrerParPeriode(entrees, periode)
  const libelles = libellesFiltres(filtres)
  const maxDate = aujourdhuiIso()

  async function submit(event) {
    event.preventDefault()
    if (erreur || !aExporter.length) return
    const nomFichier = nomFichierExport(periode)
    setEnCours(true)
    setEchec(null)
    try {
      await exporterJournalAudit({
        entrees: aExporter,
        nomFichier,
        parametres: { periode: libellePeriode(periode), ...libelles },
      })
      onExported({ nomFichier, nombre: aExporter.length })
    } catch {
      setEchec('L’export a échoué. Réessayez dans un instant.')
      setEnCours(false)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="audit-export-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Export Excel</p>
            <h2 id="audit-export-title">Exporter le journal</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form" onSubmit={submit} noValidate>
          <p className="audit-export-hint">Période optionnelle : laissez les deux dates vides pour exporter tout le journal.</p>
          <div className="audit-export-dates">
            <label>
              Début
              <input type="date" value={debut} max={fin || maxDate} onChange={(event) => setDebut(event.target.value)} aria-invalid={Boolean(erreur)} />
            </label>
            <label>
              Fin
              <input type="date" value={fin} min={debut || undefined} max={maxDate} onChange={(event) => setFin(event.target.value)} aria-invalid={Boolean(erreur)} aria-describedby={erreur ? 'audit-export-erreur' : undefined} />
            </label>
          </div>
          {erreur && <p className="staff-users-error audit-export-error" id="audit-export-erreur" role="alert">{erreur}</p>}

          <dl className="staff-user-details audit-export-summary">
            <div><dt>Rôle</dt><dd>{libelles.role}</dd></div>
            <div><dt>Type d’action</dt><dd>{libelles.domaine}</dd></div>
            <div><dt>Recherche</dt><dd>{libelles.recherche}</dd></div>
            <div><dt>Période</dt><dd>{libellePeriode(periode)}</dd></div>
          </dl>
          {!erreur && (
            <p className="audit-export-count" aria-live="polite">
              {aExporter.length === 0
                ? 'Aucune action ne correspond : rien à exporter.'
                : `${aExporter.length} action${aExporter.length > 1 ? 's' : ''} à exporter`}
            </p>
          )}
          {echec && <p className="staff-users-error audit-export-error" role="alert">{echec}</p>}

          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
            <button className="manager-button manager-button-primary audit-export-submit" type="submit" disabled={Boolean(erreur) || !aExporter.length || enCours}>
              <i className="fa-solid fa-file-excel" aria-hidden="true" /> {enCours ? 'Export…' : 'Exporter'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function JournalAudit() {
  const { roleSlug } = useParams()
  const roleResolu = roleDepuisSlug(roleSlug)
  const roleValide = roleResolu !== null
  // Repli pour que les Hooks ci-dessous recoivent toujours un role audit
  // valide, meme sur un slug invalide : on ne doit JAMAIS retourner avant
  // d’avoir appele tous les Hooks (regle des Hooks) — un slug
  // invalide change ici sans demontage (meme route /journal-audit/:roleSlug
  // appariee), le nombre d’appels de Hooks doit donc rester identique
  // a chaque rendu. On ne redirige qu’a la toute fin, dans le JSX.
  const role = roleResolu ?? ROLES_AUDIT[0]

  const [recherche, setRecherche] = useState('')
  const [domaine, setDomaine] = useState(TOUS)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [exportOuvert, setExportOuvert] = useState(false)
  const [toast, setToast] = useState(null)

  // Recherche/domaine/pagination ne survivent pas a un changement de role
  // (pilule en haut de page ou dropdown sidebar) : on repart d’une page
  // propre sur le nouveau role plutot que de garder un filtre qui n’a
  // peut-etre plus de sens.
  useEffect(() => {
    setRecherche('')
    setDomaine(TOUS)
    setPage(1)
  }, [role])

  const entreesDuRole = useMemo(
    () => journalAudit.filter((entree) => entree.acteur.role === role),
    [role],
  )

  const domaineItems = useMemo(() => [
    { key: TOUS, label: 'Toutes', icon: 'fa-layer-group', value: entreesDuRole.length, ...TOUTES_ACCENT },
    ...Object.entries(DOMAINES_AUDIT).map(([key, { label, icon }]) => ({
      key,
      label,
      icon,
      value: entreesDuRole.filter((entree) => entree.domaine === key).length,
      ...DOMAINE_ACCENTS[key],
    })),
  ], [entreesDuRole])

  const filtres = { role, domaine, recherche }
  const filtresActifs = domaine !== TOUS || recherche.trim() !== ''
  const resultats = useMemo(
    () => filtrerJournal(entreesDuRole, { domaine, recherche }),
    [entreesDuRole, domaine, recherche],
  )
  const pageCount = Math.max(1, Math.ceil(resultats.length / rows))
  const groupes = grouperParJour(resultats.slice((page - 1) * rows, page * rows))

  function changerDomaine(key) {
    setDomaine(key)
    setPage(1)
  }

  function changerRecherche(valeur) {
    setRecherche(valeur)
    setPage(1)
  }

  function reinitialiser() {
    setRecherche('')
    setDomaine(TOUS)
    setPage(1)
  }

  if (!roleValide) return <Navigate to="/journal-audit/cuisine" replace />

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Traçabilité</p>
          <h1>Journal d’audit · {ROLE_LABELS[role]}</h1>
          <p>Toutes les actions enregistrées pour l’équipe {ROLE_LABELS[role]}, en consultation seule.</p>
        </div>
      </section>

      <section>
        <nav className="audit-role-tabs" aria-label="Choisir un rôle">
          {ROLES_AUDIT.map((r) => (
            <NavLink
              key={r}
              to={`/journal-audit/${SLUG_PAR_ROLE[r]}`}
              className={({ isActive }) => `audit-role-tab ${isActive ? 'is-active' : ''}`}
            >
              {ROLE_LABELS[r]}
            </NavLink>
          ))}
        </nav>

        <StatFilterCards
          items={domaineItems}
          selected={domaine}
          onSelect={changerDomaine}
          ariaLabel="Filtrer par type d’action"
        />

        <div className="crud-toolbar audit-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="Mot-clé ou nom d’employé…"
              aria-label="Rechercher un employé ou une action"
              value={recherche}
              onChange={(event) => changerRecherche(event.target.value)}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setExportOuvert(true)}>
            <i className="fa-solid fa-file-excel" aria-hidden="true" /> Exporter
          </button>
        </div>

        {resultats.length === 0 ? (
          <div className="crud-empty audit-empty">
            <p>Aucune action ne correspond à ces filtres.</p>
            {filtresActifs && (
              <button className="manager-button manager-button-quiet" type="button" onClick={reinitialiser}>Réinitialiser les filtres</button>
            )}
          </div>
        ) : (
          <div className="dashboard-panel audit-panel">
            {groupes.map((groupe) => (
              <section className="audit-day" key={groupe.cle} aria-labelledby={`audit-jour-${groupe.cle}`}>
                <h2 className="audit-day-heading" id={`audit-jour-${groupe.cle}`}>{groupe.libelle}</h2>
                <ul className="dashboard-activity-list">
                  {groupe.entrees.map((entree) => (
                    <li key={entree.id}>
                      <div className="dashboard-activity-row is-static is-wrapping">
                        <span className="dashboard-activity-icon" aria-hidden="true"><i className={`fa-solid ${DOMAINES_AUDIT[entree.domaine].icon}`} /></span>
                        <span className="dashboard-activity-text">
                          <strong>{entree.acteur.nom} {entree.action}</strong>
                          <span>{ROLE_LABELS[entree.acteur.role]} · {DOMAINES_AUDIT[entree.domaine].label}</span>
                        </span>
                        <time className="dashboard-activity-time" dateTime={entree.createdAt} title={new Date(entree.createdAt).toLocaleString('fr-FR')}>
                          {new Date(entree.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          rowsPerPage={rows}
          totalItems={resultats.length}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      {exportOuvert && (
        <ExportAuditModal
          entrees={resultats}
          filtres={filtres}
          onClose={() => setExportOuvert(false)}
          onExported={({ nomFichier, nombre }) => {
            setExportOuvert(false)
            setToast({ id: Date.now(), type: 'success', message: `${nombre} action${nombre > 1 ? 's' : ''} exportée${nombre > 1 ? 's' : ''} dans « ${nomFichier} ».` })
          }}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
