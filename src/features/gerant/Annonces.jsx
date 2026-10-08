import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import AnnonceFormModal from './AnnonceFormModal.jsx'
import AnnoncePreviewModal from './AnnoncePreviewModal.jsx'
import { useAnnonces } from './AnnoncesContext.jsx'
import { STATUT_LABELS, countByStatut } from './menuData.js'

const FILTER_DEFS = [
  { key: 'ACTIF', label: 'Chaînes actives', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function Annonces() {
  const { chaines, chainesActives, creerChaine, modifierChaine, publierChaine, majStatutChaine, supprimerChaine } = useAnnonces()

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

  const counts = useMemo(() => countByStatut(chaines), [chaines])
  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return chaines
      .filter((chaine) => chaine.statut === filter)
      .filter((chaine) => !query || chaine.titre.toLowerCase().includes(query) || chaine.slides.some((slide) => slide.titre.toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [chaines, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtrees.length / rows))
  const visibles = filtrees.slice((page - 1) * rows, page * rows)

  function handlePublier(chaine) {
    publierChaine(chaine.id)
    notify('success', `« ${chaine.titre} » publiée.`)
    setModal(null)
  }

  function handleDepublier(chaine) {
    majStatutChaine(chaine.id, 'BROUILLON')
    notify('success', `« ${chaine.titre} » dépubliée et repassée en brouillon.`)
    setModal(null)
  }

  function handleArchiver(chaine) {
    majStatutChaine(chaine.id, 'ARCHIVE')
    notify('success', `« ${chaine.titre} » archivée.`)
    setModal(null)
  }

  function handleRestaurer(chaine) {
    majStatutChaine(chaine.id, 'BROUILLON')
    notify('success', `« ${chaine.titre} » restaurée en brouillon.`)
    setModal(null)
  }

  function handleSave(data) {
    if (modal?.kind === 'annonce-form' && modal.chaine) {
      modifierChaine(modal.chaine.id, data)
      notify('success', `« ${data.titre} » mise à jour.`)
    } else if (data.statut === 'ACTIF') {
      const nouvelle = creerChaine({ ...data, statut: 'BROUILLON' })
      publierChaine(nouvelle.id)
      notify('success', `« ${data.titre} » créée et publiée.`)
    } else {
      creerChaine(data)
      notify('success', `« ${data.titre} » créée en brouillon.`)
    }
    setModal(null)
  }

  function handleSupprimer(chaine) {
    supprimerChaine(chaine.id)
    notify('success', `« ${chaine.titre} » supprimée.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Chaînes d’annonces</h1>
          <p>Les chaînes actives se succèdent côté client ; les annonces de chaque chaîne défilent dans un carrousel.</p>
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
              placeholder="Rechercher une chaîne ou une slide…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'annonce-form', chaine: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une chaîne
          </button>
        </div>

        {visibles.length === 0 && (
          <p className="crud-empty">Aucune chaîne {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
        )}

        <div className="crud-grid">
          {visibles.map((chaine) => (
            <article className="crud-grid-card" key={chaine.id}>
              <div className="crud-grid-photo">
                {chaine.slides[0]?.imageUrl ? <img src={chaine.slides[0].imageUrl} alt="" /> : <i className="fa-solid fa-bullhorn" aria-hidden="true" />}
                <StatusBadge statut={chaine.statut} label={STATUT_LABELS[chaine.statut]} />
              </div>

              <div className="crud-grid-body">
                <h3 className="crud-grid-title">{chaine.titre}</h3>
                <div className="crud-grid-meta">
                  <span>{chaine.slides.length} slide{chaine.slides.length > 1 ? 's' : ''} · {chaine.slides[0]?.titre}</span>
                </div>

                <div className="crud-card-actions crud-grid-footer">
                  <button className="crud-action is-accent-green" type="button" onClick={() => setModal({ kind: 'annonce-apercu', chaine })}>
                    <i className="fa-solid fa-image" aria-hidden="true" /> Aperçu
                  </button>

                  {chaine.statut === 'BROUILLON' && (
                    <>
                      <button className="crud-action" type="button" onClick={() => setModal({ kind: 'annonce-form', chaine })}>
                        <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                      </button>
                      <button className="crud-action is-publish" type="button" onClick={() => handlePublier(chaine)}>
                        <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                      </button>
                    </>
                  )}

                  {chaine.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-orange" type="button" onClick={() => setModal({ kind: 'confirm-depublier-annonce', chaine })}>
                      <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                    </button>
                  )}

                  {chaine.statut === 'BROUILLON' && (
                    <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'confirm-delete-annonce', chaine })}>
                      <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer
                    </button>
                  )}
                  {chaine.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-red" type="button" onClick={() => setModal({ kind: 'confirm-archive-annonce', chaine })}>
                      <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                    </button>
                  )}
                  {chaine.statut === 'ARCHIVE' && (
                    <button className="crud-action is-archive" type="button" onClick={() => setModal({ kind: 'confirm-restaurer-annonce', chaine })}>
                      <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Restaurer
                    </button>
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
          totalItems={filtrees.length}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      {modal?.kind === 'annonce-form' && (
        <AnnonceFormModal annonce={modal.chaine} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'annonce-apercu' && (
        <AnnoncePreviewModal chaine={modal.chaine} chainesActives={chainesActives} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'confirm-depublier-annonce' && (
        <ConfirmModal
          title="Dépublier cette chaîne ?"
          message={`« ${modal.chaine.titre} » ne s'affichera plus côté client et repassera en brouillon. Vous pourrez la republier à tout moment.`}
          confirmLabel="Dépublier"
          tone="warning"
          icon="fa-eye-slash"
          onConfirm={() => handleDepublier(modal.chaine)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive-annonce' && (
        <ConfirmModal
          title="Archiver cette chaîne ?"
          message={`« ${modal.chaine.titre} » sera retirée et déplacée dans les archives. Vous pourrez la restaurer plus tard depuis le filtre Archivés.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.chaine)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-restaurer-annonce' && (
        <ConfirmModal
          title="Restaurer cette chaîne ?"
          message={`« ${modal.chaine.titre} » sera retirée des archives et repassera en brouillon.`}
          confirmLabel="Restaurer"
          tone="warning"
          icon="fa-clock-rotate-left"
          onConfirm={() => handleRestaurer(modal.chaine)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete-annonce' && (
        <ConfirmModal
          title="Supprimer cette chaîne ?"
          message={`« ${modal.chaine.titre} » sera définitivement supprimée. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.chaine)}
          onCancel={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
