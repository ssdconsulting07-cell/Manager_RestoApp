import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import { canalLabel, modeLabel, noteCommande, resumePlats, ticketId } from '../cuisine/cuisineUtils.js'
import { exporterLivraisons } from './exportLivraisons.js'
import {
  bornesPeriodeRapide, erreurPeriode, filtrerLivraisons, filtrerParPeriode, libellePeriode, libellePeriodeRapide,
  libellesFiltres, nomFichierExport, PERIODE_RAPIDE_DEFAUT,
} from './livraisonsFiltres.js'
import { useLivreurBoard } from './useLivreurBoard.js'

// Historique des livraisons (Livreur) : toutes les commandes livrees, en
// consultation seule, avec recherche, filtre rapide de periode et export
// Excel par periode — meme patron que le Journal d'audit cote Manager
// (JournalAudit.jsx), dont ce fichier reprend la structure (groupement par
// jour, modale d'export avec bornes de dates), mais sans filtre
// role/domaine (un seul acteur ici). Repondait a une demande explicite :
// « Historique complet + filtre dates », choisi plutot que la version plus
// simple « aujourd'hui seulement ». Les livraisons sortent de l'ecran
// Livraisons.jsx une fois scannees (voir son commentaire) — c'est cet
// ecran qui en garde la trace.
//
// Le filtre rapide ci-dessous (Aujourd'hui / Cette semaine / Tout, par
// defaut "Aujourd'hui") borne uniquement ce qui est AFFICHE a l'ecran —
// il reutilise filtrerParPeriode() mais est applique separement de la
// recherche, APRES elle, pour ne pas limiter l'export : la modale
// d'export part de `resultats` (recherche seule), pas de `affichees`, afin
// de pouvoir exporter plus large que la vue du moment (ex. exporter tout
// l'historique alors que l'ecran n'affiche que "Aujourd'hui").
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

function grouperParJour(livrees) {
  const groupes = []
  for (const commande of livrees) {
    const date = new Date(commande.livreeLe || commande.creeLe)
    const cle = cleJour(date)
    if (groupes.at(-1)?.cle !== cle) groupes.push({ cle, libelle: libelleJour(date), commandes: [] })
    groupes.at(-1).commandes.push(commande)
  }
  return groupes
}

function aujourdhuiIso() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function ExportLivraisonsModal({ livrees, produits, filtres, onExported, onClose }) {
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [echec, setEchec] = useState(null)

  const periode = { debut, fin }
  const erreur = erreurPeriode(periode)
  const aExporter = erreur ? [] : filtrerParPeriode(livrees, periode)
  const libelles = libellesFiltres(filtres)
  const maxDate = aujourdhuiIso()

  async function submit(event) {
    event.preventDefault()
    if (erreur || !aExporter.length) return
    const nomFichier = nomFichierExport(periode)
    setEnCours(true)
    setEchec(null)
    try {
      await exporterLivraisons({
        livrees: aExporter,
        produits,
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
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="historique-livraisons-export-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Export Excel</p>
            <h2 id="historique-livraisons-export-title">Exporter l’historique</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form" onSubmit={submit} noValidate>
          <p className="audit-export-hint">Période optionnelle : laissez les deux dates vides pour exporter tout l’historique.</p>
          <div className="audit-export-dates">
            <label>
              Début
              <input type="date" value={debut} max={fin || maxDate} onChange={(event) => setDebut(event.target.value)} aria-invalid={Boolean(erreur)} />
            </label>
            <label>
              Fin
              <input type="date" value={fin} min={debut || undefined} max={maxDate} onChange={(event) => setFin(event.target.value)} aria-invalid={Boolean(erreur)} aria-describedby={erreur ? 'historique-livraisons-export-erreur' : undefined} />
            </label>
          </div>
          {erreur && <p className="staff-users-error audit-export-error" id="historique-livraisons-export-erreur" role="alert">{erreur}</p>}

          <dl className="staff-user-details audit-export-summary">
            <div><dt>Recherche</dt><dd>{libelles.recherche}</dd></div>
            <div><dt>Période</dt><dd>{libellePeriode(periode)}</dd></div>
          </dl>
          {!erreur && (
            <p className="audit-export-count" aria-live="polite">
              {aExporter.length === 0
                ? 'Aucune livraison ne correspond : rien à exporter.'
                : `${aExporter.length} livraison${aExporter.length > 1 ? 's' : ''} à exporter`}
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

export default function HistoriqueLivraisons() {
  const { livrees, produits, loading, error, demo, charger } = useLivreurBoard()
  const [recherche, setRecherche] = useState('')
  const [periodeRapide, setPeriodeRapide] = useState(PERIODE_RAPIDE_DEFAUT)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [rafraichissement, setRafraichissement] = useState(false)
  const [exportOuvert, setExportOuvert] = useState(false)
  const [toast, setToast] = useState(null)

  const filtres = { recherche }
  const rechercheActive = recherche.trim() !== ''
  const filtresActifs = rechercheActive || periodeRapide !== PERIODE_RAPIDE_DEFAUT
  // Distinct de filtresActifs : vrai seulement s'il reste une vue plus large
  // a proposer (le bouton de secours ci-dessous n'a aucun effet utile si la
  // periode est deja "Tout" et la recherche vide).
  const peutElargir = rechercheActive || periodeRapide !== 'tous'
  // `resultats` (recherche seule) alimente l'export, qui doit pouvoir viser
  // plus large que ce que le filtre rapide affiche a l'ecran.
  const resultats = useMemo(() => filtrerLivraisons(livrees, produits, { recherche }), [livrees, produits, recherche])
  const affichees = useMemo(
    () => filtrerParPeriode(resultats, bornesPeriodeRapide(periodeRapide)),
    [resultats, periodeRapide],
  )
  const triees = useMemo(
    () => [...affichees].sort((a, b) => new Date(b.livreeLe || b.creeLe) - new Date(a.livreeLe || a.creeLe)),
    [affichees],
  )
  const pageCount = Math.max(1, Math.ceil(triees.length / rows))
  const groupes = grouperParJour(triees.slice((page - 1) * rows, page * rows))

  function changer(setter) {
    return (valeur) => { setter(valeur); setPage(1) }
  }

  // Repart de la vue la plus large (recherche videe, periode "Tout") plutot
  // que du defaut "Aujourd'hui" : si la liste est vide parce que rien n'a
  // ete livre aujourd'hui, revenir au defaut ne changerait rien.
  function reinitialiser() {
    setRecherche('')
    setPeriodeRapide('tous')
    setPage(1)
  }

  async function handleRafraichir() {
    setRafraichissement(true)
    try {
      await charger()
    } finally {
      setRafraichissement(false)
    }
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Livraison</p>
          <h1>Historique des livraisons</h1>
          <p>Toutes les commandes livrées, du plus récent au plus ancien, avec export par période.</p>
        </div>
      </section>

      <section>
        {error && !demo && (
          <p role="alert" className="cuisine-board-error">
            {error}
          </p>
        )}

        {loading ? (
          <PageSkeleton page="historique-livraisons" contentOnly />
        ) : (
          <>
            <div className="crud-toolbar audit-toolbar">
              <div className="crud-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="N° de ticket ou plat…"
                  aria-label="Rechercher une livraison"
                  value={recherche}
                  onChange={(event) => changer(setRecherche)(event.target.value)}
                />
              </div>
              <select
                className="audit-select"
                aria-label="Filtrer par période"
                value={periodeRapide}
                onChange={(event) => changer(setPeriodeRapide)(event.target.value)}
              >
                <option value="aujourdhui">Aujourd’hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="tous">Tout</option>
              </select>
              <span className="crud-toolbar-spacer" />
              <button
                type="button"
                className="cuisine-refresh-button"
                onClick={handleRafraichir}
                disabled={rafraichissement}
                aria-label="Actualiser l’historique"
              >
                <i className={`fa-solid fa-arrows-rotate${rafraichissement ? ' is-spinning' : ''}`} aria-hidden="true" />
                Actualiser
              </button>
              <button className="crud-add-button" type="button" onClick={() => setExportOuvert(true)}>
                <i className="fa-solid fa-file-excel" aria-hidden="true" /> Exporter
              </button>
            </div>

            {triees.length === 0 ? (
              <div className="crud-empty audit-empty">
                <p>
                  {filtresActifs
                    ? `Aucune livraison ne correspond à ces filtres (${libellePeriodeRapide(periodeRapide).toLowerCase()}).`
                    : 'Aucune livraison enregistrée pour le moment.'}
                </p>
                {peutElargir && (
                  <button className="manager-button manager-button-quiet" type="button" onClick={reinitialiser}>Voir tout l’historique</button>
                )}
              </div>
            ) : (
              <div className="dashboard-panel audit-panel">
                {groupes.map((groupe) => (
                  <section className="audit-day" key={groupe.cle} aria-labelledby={`livraisons-jour-${groupe.cle}`}>
                    <h2 className="audit-day-heading" id={`livraisons-jour-${groupe.cle}`}>{groupe.libelle}</h2>
                    <ul className="dashboard-activity-list">
                      {groupe.commandes.map((commande) => (
                        <li key={commande.id}>
                          <div className="dashboard-activity-row is-static is-wrapping">
                            <span className="dashboard-activity-icon" aria-hidden="true"><i className="fa-solid fa-flag-checkered" /></span>
                            <span className="dashboard-activity-text">
                              <strong>#{ticketId(commande)} · {resumePlats(commande.lignes, produits)}</strong>
                              <span>
                                {canalLabel(commande)} · {modeLabel(commande.mode)}
                                {noteCommande(commande) ? ` · ${noteCommande(commande)}` : ''}
                              </span>
                            </span>
                            <time
                              className="dashboard-activity-time"
                              dateTime={commande.livreeLe || commande.creeLe}
                              title={new Date(commande.livreeLe || commande.creeLe).toLocaleString('fr-FR')}
                            >
                              {new Date(commande.livreeLe || commande.creeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
              totalItems={triees.length}
              onPageChange={setPage}
              onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
              rowsOptions={ROWS_OPTIONS}
            />
          </>
        )}
      </section>

      {exportOuvert && (
        <ExportLivraisonsModal
          livrees={resultats}
          produits={produits}
          filtres={filtres}
          onClose={() => setExportOuvert(false)}
          onExported={({ nomFichier, nombre }) => {
            setExportOuvert(false)
            setToast({ id: Date.now(), type: 'success', message: `${nombre} livraison${nombre > 1 ? 's' : ''} exportée${nombre > 1 ? 's' : ''} dans « ${nomFichier} ».` })
          }}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
