import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import { ROLE_LABELS, ROLES } from '../../auth/roles.js'
import { DOMAINES_AUDIT, journalAudit } from './auditData.js'
import {
  TOUS, erreurPeriode, filtrerJournal, filtrerParPeriode, libellePeriode, libellesFiltres, nomFichierExport,
} from './journalAuditFiltres.js'
import { exporterJournalAudit } from './exportJournalAudit.js'

// Journal d'audit (Manager) : consultation seule de toutes les actions metier
// du personnel. Meme source que l'apercu du tableau de bord (auditData.js).
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
  const [recherche, setRecherche] = useState('')
  const [role, setRole] = useState(TOUS)
  const [domaine, setDomaine] = useState(TOUS)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [exportOuvert, setExportOuvert] = useState(false)
  const [toast, setToast] = useState(null)

  const filtres = { role, domaine, recherche }
  const filtresActifs = role !== TOUS || domaine !== TOUS || recherche.trim() !== ''
  const resultats = useMemo(() => filtrerJournal(journalAudit, { role, domaine, recherche }), [role, domaine, recherche])
  const pageCount = Math.max(1, Math.ceil(resultats.length / rows))
  const groupes = grouperParJour(resultats.slice((page - 1) * rows, page * rows))

  function changer(setter) {
    return (valeur) => { setter(valeur); setPage(1) }
  }

  function reinitialiser() {
    setRecherche('')
    setRole(TOUS)
    setDomaine(TOUS)
    setPage(1)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Traçabilité</p>
          <h1>Journal d’audit</h1>
          <p>Toutes les actions du personnel sur les commandes, le menu, les annonces et les comptes, en consultation seule.</p>
        </div>
      </section>

      <section>
        <div className="crud-toolbar audit-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="Employé ou mot-clé…"
              aria-label="Rechercher un employé ou une action"
              value={recherche}
              onChange={(event) => changer(setRecherche)(event.target.value)}
            />
          </div>
          <select className="audit-select" aria-label="Filtrer par rôle" value={role} onChange={(event) => changer(setRole)(event.target.value)}>
            <option value={TOUS}>Tous les rôles</option>
            {ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
          </select>
          <select className="audit-select" aria-label="Filtrer par type d’action" value={domaine} onChange={(event) => changer(setDomaine)(event.target.value)}>
            <option value={TOUS}>Tous les types</option>
            {Object.entries(DOMAINES_AUDIT).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
          </select>
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
