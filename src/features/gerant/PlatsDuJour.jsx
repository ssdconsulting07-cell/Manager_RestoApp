import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import PlatDuJourFormModal from './PlatDuJourFormModal.jsx'
import {
  JOURS_SEMAINE,
  PLATS_DU_JOUR_INITIAUX,
  STATUT_LABELS,
  countByStatut,
  createPlatDuJourId,
  jourLabel,
} from './platsDuJourData.js'

// Page "Plat du jour" (Gerant, 24/10/2026) - fiches independantes du
// catalogue Produits (plus de badge/toggle sur un produit existant), un
// jour de la semaine par fiche, plusieurs plats possibles le meme jour
// (cadrage du 24/10/2026). Meme pattern que Produits.jsx (StatFilterCards
// Actifs/Brouillons/Archives, grille de cartes, pagination) - voir
// brainstorming-chez-ketchup.md.
const FILTER_DEFS = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function PlatsDuJour() {
  const [plats, setPlats] = useState(PLATS_DU_JOUR_INITIAUX)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)

  const [filter, setFilter] = useState('ACTIF')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(10)

  function notify(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  function changerFiltre(key) {
    setFilter(key)
    setPage(1)
  }

  const counts = useMemo(() => countByStatut(plats), [plats])
  const filtres = useMemo(() => {
    const query = search.trim().toLowerCase()
    return plats
      .filter((p) => p.statut === filter)
      .filter((p) => !query || p.nom.toLowerCase().includes(query) || jourLabel(p.jour).toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plats, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtres.length / rows))
  const visibles = filtres.slice((page - 1) * rows, page * rows)

  function majStatut(id, statut) {
    setPlats((prev) => prev.map((p) => (p.id === id ? { ...p, statut, updatedAt: new Date().toISOString() } : p)))
  }

  function handlePublier(plat) {
    majStatut(plat.id, 'ACTIF')
    notify('success', `« ${plat.nom} » publié.`)
  }

  function handleDepublier(plat) {
    majStatut(plat.id, 'BROUILLON')
    notify('success', `« ${plat.nom} » dépublié et repassé en brouillon.`)
    setModal(null)
  }

  function handleArchiver(plat) {
    majStatut(plat.id, 'ARCHIVE')
    notify('success', `« ${plat.nom} » archivé.`)
    setModal(null)
  }

  function handleRestaurer(plat) {
    majStatut(plat.id, 'BROUILLON')
    notify('success', `« ${plat.nom} » restauré en brouillon.`)
    setModal(null)
  }

  function handleSave(data) {
    if (modal?.kind === 'plat-form' && modal.plat) {
      setPlats((prev) => prev.map((p) => (p.id === modal.plat.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)))
      notify('success', `« ${data.nom} » mis à jour.`)
    } else {
      const nouveau = { id: createPlatDuJourId(), statut: 'BROUILLON', ...data, updatedAt: new Date().toISOString() }
      setPlats((prev) => [nouveau, ...prev])
      notify('success', data.statut === 'ACTIF' ? `« ${data.nom} » créé et publié.` : `« ${data.nom} » créé en brouillon.`)
    }
    setModal(null)
  }

  function handleSupprimer(plat) {
    setPlats((prev) => prev.filter((p) => p.id !== plat.id))
    notify('success', `« ${plat.nom} » supprimé.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Plat du jour</h1>
          <p>Gérez les plats du jour, chacun rattaché à un jour de la semaine — le site les affiche automatiquement le jour venu.</p>
        </div>
      </section>

      <section>
        <StatFilterCards
          items={FILTER_DEFS.map((f) => ({ ...f, value: counts[f.key] }))}
          selected={filter}
          onSelect={changerFiltre}
        />

        <div className="crud-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un plat ou un jour…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'plat-form', plat: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter un plat du jour
          </button>
        </div>

        {visibles.length === 0 && (
          <p className="crud-empty">Aucun plat du jour {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
        )}

        <div className="crud-grid">
          {visibles.map((plat) => (
            <article className="crud-grid-card" key={plat.id}>
              <div className="crud-grid-photo">
                {plat.photoUrl ? <img src={plat.photoUrl} alt="" /> : <i className="fa-solid fa-image" aria-hidden="true" />}
                <StatusBadge statut={plat.statut} label={STATUT_LABELS[plat.statut]} />
                <div className="crud-product-highlight-badges">
                  <span className="crud-product-highlight is-daily"><i className="fa-solid fa-calendar-day" aria-hidden="true" /> {jourLabel(plat.jour)}</span>
                </div>
              </div>

              <div className="crud-grid-body">
                <h3 className="crud-grid-title">{plat.nom}</h3>
                <strong className="crud-grid-price">{plat.prix.toLocaleString('fr-FR')} F CFA</strong>

                <div className="crud-card-actions crud-grid-footer">
                  {plat.statut === 'BROUILLON' && (
                    <button className="crud-action is-publish" type="button" onClick={() => handlePublier(plat)}>
                      <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                    </button>
                  )}
                  {plat.statut !== 'ARCHIVE' && (
                    <button className="crud-action" type="button" onClick={() => setModal({ kind: 'plat-form', plat })}>
                      <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                    </button>
                  )}
                  {plat.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-orange" type="button" onClick={() => setModal({ kind: 'confirm-depublier', plat })}>
                      <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                    </button>
                  )}
                  {plat.statut !== 'ARCHIVE' && (
                    <button className="crud-action is-accent-red" type="button" onClick={() => setModal({ kind: 'confirm-archive', plat })}>
                      <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                    </button>
                  )}
                  {plat.statut === 'ARCHIVE' && (
                    <>
                      <button className="crud-action is-archive" type="button" onClick={() => setModal({ kind: 'confirm-restaurer', plat })}>
                        <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Restaurer
                      </button>
                      <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'confirm-delete', plat })}>
                        <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          rowsPerPage={rows}
          totalItems={filtres.length}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      {modal?.kind === 'plat-form' && (
        <PlatDuJourFormModal
          plat={modal.plat}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-depublier' && (
        <ConfirmModal
          title="Dépublier ce plat du jour ?"
          message={`« ${modal.plat.nom} » repassera en brouillon et ne sera plus visible côté client.`}
          confirmLabel="Dépublier"
          tone="warning"
          icon="fa-eye-slash"
          onConfirm={() => handleDepublier(modal.plat)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive' && (
        <ConfirmModal
          title="Archiver ce plat du jour ?"
          message={`« ${modal.plat.nom} » sera archivé et retiré de la liste active.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.plat)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-restaurer' && (
        <ConfirmModal
          title="Restaurer ce plat du jour ?"
          message={`« ${modal.plat.nom} » repassera en brouillon, modifiable avant republication.`}
          confirmLabel="Restaurer"
          tone="info"
          icon="fa-clock-rotate-left"
          onConfirm={() => handleRestaurer(modal.plat)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete' && (
        <ConfirmModal
          title="Supprimer définitivement ce plat du jour ?"
          message={`« ${modal.plat.nom} » sera supprimé sans possibilité de restauration.`}
          confirmLabel="Supprimer définitivement"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.plat)}
          onCancel={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
