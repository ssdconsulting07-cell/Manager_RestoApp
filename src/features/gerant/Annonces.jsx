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
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function Annonces() {
  const { annonces, creerAnnonce, modifierAnnonce, publierAnnonce, majStatutAnnonce, supprimerAnnonce } = useAnnonces()

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

  const counts = useMemo(() => countByStatut(annonces), [annonces])
  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return annonces
      .filter((a) => a.statut === filter)
      .filter((a) => !query || a.titre.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [annonces, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtrees.length / rows))
  const visibles = filtrees.slice((page - 1) * rows, page * rows)

  // Une seule annonce active a la fois : si une autre l'est deja, on previent
  // avant de publier (effet de bord pas forcement evident), sinon on publie
  // directement comme pour Produits/Categories.
  function handlePublierClick(annonce) {
    const autre = annonces.find((a) => a.statut === 'ACTIF' && a.id !== annonce.id)
    if (autre) {
      setModal({ kind: 'confirm-publier-annonce', annonce, autre })
    } else {
      handlePublier(annonce)
    }
  }

  function handlePublier(annonce) {
    publierAnnonce(annonce.id)
    notify('success', `« ${annonce.titre} » publiée.`)
    setModal(null)
  }

  function handleDepublier(annonce) {
    majStatutAnnonce(annonce.id, 'BROUILLON')
    notify('success', `« ${annonce.titre} » dépubliée et repassée en brouillon.`)
    setModal(null)
  }

  function handleArchiver(annonce) {
    majStatutAnnonce(annonce.id, 'ARCHIVE')
    notify('success', `« ${annonce.titre} » archivée.`)
    setModal(null)
  }

  function handleRestaurer(annonce) {
    majStatutAnnonce(annonce.id, 'BROUILLON')
    notify('success', `« ${annonce.titre} » restaurée en brouillon.`)
    setModal(null)
  }

  function handleSave(data) {
    if (modal?.kind === 'annonce-form' && modal.annonce) {
      modifierAnnonce(modal.annonce.id, data)
      notify('success', `« ${data.titre} » mise à jour.`)
    } else if (data.statut === 'ACTIF') {
      // Creation directe en Actif (bouton "Publier" du formulaire) : passe
      // par la meme regle de singleton que publierAnnonce.
      const nouvelle = creerAnnonce({ ...data, statut: 'BROUILLON' })
      publierAnnonce(nouvelle.id)
      notify('success', `« ${data.titre} » créée et publiée.`)
    } else {
      creerAnnonce(data)
      notify('success', `« ${data.titre} » créée en brouillon.`)
    }
    setModal(null)
  }

  function handleSupprimer(annonce) {
    supprimerAnnonce(annonce.id)
    notify('success', `« ${annonce.titre} » supprimée.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Annonces</h1>
          <p>Gérez le popup « nouveauté » affiché à l'arrivée sur l'app Client. Une seule annonce est visible à la fois.</p>
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
              placeholder="Rechercher une annonce…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'annonce-form', annonce: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une annonce
          </button>
        </div>

        <div className="crud-list">
          {visibles.length === 0 && (
            <p className="crud-empty">Aucune annonce {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
          )}
          {visibles.map((annonce) => (
            <article className="crud-card" key={annonce.id}>
              <span className="crud-card-photo is-wide" aria-hidden="true">
                {annonce.imageUrl ? <img src={annonce.imageUrl} alt="" /> : <i className="fa-solid fa-bullhorn" />}
              </span>
              <div className="crud-card-body">
                <div className="crud-card-top">
                  <span className="crud-card-title">{annonce.titre}</span>
                  <StatusBadge statut={annonce.statut} label={STATUT_LABELS[annonce.statut]} />
                </div>
                <div className="crud-card-meta">
                  <span>{annonce.message || 'Aucun message.'}</span>
                </div>

                <div className="crud-card-actions">
                  <button className="crud-action is-accent-green" type="button" onClick={() => setModal({ kind: 'annonce-apercu', annonce })}>
                    <i className="fa-solid fa-image" aria-hidden="true" /> Aperçu
                  </button>

                  {annonce.statut === 'BROUILLON' && (
                    <>
                      <button className="crud-action" type="button" onClick={() => setModal({ kind: 'annonce-form', annonce })}>
                        <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                      </button>
                      <button className="crud-action is-publish" type="button" onClick={() => handlePublierClick(annonce)}>
                        <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                      </button>
                    </>
                  )}

                  {annonce.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-orange" type="button" onClick={() => setModal({ kind: 'confirm-depublier-annonce', annonce })}>
                      <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                    </button>
                  )}

                  <span className="crud-action-spacer" />

                  {annonce.statut === 'BROUILLON' && (
                    <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'confirm-delete-annonce', annonce })}>
                      <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer
                    </button>
                  )}
                  {annonce.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-red" type="button" onClick={() => setModal({ kind: 'confirm-archive-annonce', annonce })}>
                      <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                    </button>
                  )}
                  {annonce.statut === 'ARCHIVE' && (
                    <button className="crud-action is-archive" type="button" onClick={() => setModal({ kind: 'confirm-restaurer-annonce', annonce })}>
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
        <AnnonceFormModal annonce={modal.annonce} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'annonce-apercu' && (
        <AnnoncePreviewModal annonce={modal.annonce} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'confirm-publier-annonce' && (
        <ConfirmModal
          title="Publier cette annonce ?"
          message={`« ${modal.autre.titre} » est actuellement affichée aux clients. La publier mettra automatiquement fin à son affichage et la repassera en brouillon.`}
          confirmLabel="Publier quand même"
          tone="warning"
          icon="fa-bullhorn"
          onConfirm={() => handlePublier(modal.annonce)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-depublier-annonce' && (
        <ConfirmModal
          title="Dépublier cette annonce ?"
          message={`« ${modal.annonce.titre} » ne s'affichera plus côté client et repassera en brouillon. Vous pourrez la republier à tout moment.`}
          confirmLabel="Dépublier"
          tone="warning"
          icon="fa-eye-slash"
          onConfirm={() => handleDepublier(modal.annonce)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive-annonce' && (
        <ConfirmModal
          title="Archiver cette annonce ?"
          message={`« ${modal.annonce.titre} » sera retirée et déplacée dans les archives. Vous pourrez la restaurer plus tard depuis le filtre Archivés.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.annonce)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-restaurer-annonce' && (
        <ConfirmModal
          title="Restaurer cette annonce ?"
          message={`« ${modal.annonce.titre} » sera retirée des archives et repassera en brouillon.`}
          confirmLabel="Restaurer"
          tone="warning"
          icon="fa-clock-rotate-left"
          onConfirm={() => handleRestaurer(modal.annonce)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete-annonce' && (
        <ConfirmModal
          title="Supprimer cette annonce ?"
          message={`« ${modal.annonce.titre} » sera définitivement supprimée. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.annonce)}
          onCancel={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
