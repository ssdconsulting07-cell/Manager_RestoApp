import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import CategoryFormModal from './CategoryFormModal.jsx'
import ReassignCategoryModal from './ReassignCategoryModal.jsx'
import CategoryPreviewModal from './CategoryPreviewModal.jsx'
import { useMenuData } from './MenuDataContext.jsx'
import { STATUT_LABELS, countByStatut } from './menuData.js'

const FILTER_DEFS = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function Categories() {
  const {
    categories,
    produits,
    majStatutCategorie,
    creerCategorie,
    modifierCategorie,
    reaffecterEtSupprimerCategorie,
    supprimerCategorie,
  } = useMenuData()

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

  const counts = useMemo(() => countByStatut(categories), [categories])
  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return categories
      .filter((c) => c.statut === filter)
      .filter((c) => !query || c.nom.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [categories, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtrees.length / rows))
  const visibles = filtrees.slice((page - 1) * rows, page * rows)

  function handlePublier(categorie) {
    majStatutCategorie(categorie.id, 'ACTIF')
    notify('success', `« ${categorie.nom} » publiée.`)
  }

  function handleDepublier(categorie) {
    majStatutCategorie(categorie.id, 'BROUILLON')
    notify('success', `« ${categorie.nom} » dépubliée et repassée en brouillon.`)
  }

  function handleArchiver(categorie) {
    majStatutCategorie(categorie.id, 'ARCHIVE')
    notify('success', `« ${categorie.nom} » archivée.`)
    setModal(null)
  }

  function handleRestaurer(categorie) {
    majStatutCategorie(categorie.id, 'BROUILLON')
    notify('success', `« ${categorie.nom} » restaurée en brouillon.`)
  }

  function handleSave(data) {
    if (modal?.kind === 'categorie-form' && modal.categorie) {
      modifierCategorie(modal.categorie.id, data)
      notify('success', `« ${data.nom} » mise à jour.`)
    } else {
      creerCategorie(data)
      notify('success', `« ${data.nom} » créée en brouillon.`)
    }
    setModal(null)
  }

  function demanderSuppression(categorie) {
    const produitsConcernes = produits.filter((p) => p.categorieId === categorie.id)
    if (produitsConcernes.length === 0) {
      setModal({ kind: 'confirm-delete-categorie', categorie })
    } else {
      setModal({
        kind: 'reassign-categorie',
        categorie,
        produitsConcernes,
        autresCategories: categories.filter((c) => c.id !== categorie.id && c.statut !== 'ARCHIVE'),
      })
    }
  }

  function handleReaffecterEtSupprimer(categorie, produitsConcernes, targetId) {
    reaffecterEtSupprimerCategorie(categorie.id, targetId)
    notify('success', `« ${categorie.nom} » supprimée, ${produitsConcernes.length} produit${produitsConcernes.length > 1 ? 's' : ''} réaffecté${produitsConcernes.length > 1 ? 's' : ''}.`)
    setModal(null)
  }

  function handleSupprimer(categorie) {
    supprimerCategorie(categorie.id)
    notify('success', `« ${categorie.nom} » supprimée.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Catégories</h1>
          <p>Organisez les catégories du menu, de leur création à leur publication côté client.</p>
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
              placeholder="Rechercher une catégorie…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'categorie-form', categorie: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une catégorie
          </button>
        </div>

        <div className="crud-list">
          {visibles.length === 0 && (
            <p className="crud-empty">Aucune catégorie {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
          )}
          {visibles.map((categorie) => {
            const nbProduits = produits.filter((p) => p.categorieId === categorie.id).length
            return (
              <article className="crud-card" key={categorie.id}>
                <span className="crud-card-photo" aria-hidden="true"><i className="fa-solid fa-tag" /></span>
                <div className="crud-card-body">
                  <div className="crud-card-top">
                    <span className="crud-card-title">{categorie.nom}</span>
                    <StatusBadge statut={categorie.statut} label={STATUT_LABELS[categorie.statut]} />
                  </div>
                  <div className="crud-card-meta">
                    <span>{nbProduits} produit{nbProduits > 1 ? 's' : ''}</span>
                  </div>

                  <div className="crud-card-actions">
                    <button className="crud-action" type="button" onClick={() => setModal({ kind: 'categorie-detail', categorie })}>
                      <i className="fa-solid fa-eye" aria-hidden="true" /> Voir
                    </button>

                    {(categorie.statut === 'ACTIF' || categorie.statut === 'BROUILLON') && (
                      <button className="crud-action" type="button" onClick={() => setModal({ kind: 'categorie-apercu', categorie })}>
                        <i className="fa-solid fa-image" aria-hidden="true" /> Aperçu
                      </button>
                    )}

                    {categorie.statut === 'BROUILLON' && (
                      <>
                        <button className="crud-action" type="button" onClick={() => setModal({ kind: 'categorie-form', categorie })}>
                          <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                        </button>
                        <button className="crud-action is-publish" type="button" onClick={() => handlePublier(categorie)}>
                          <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                        </button>
                      </>
                    )}

                    {categorie.statut === 'ACTIF' && (
                      <button className="crud-action" type="button" onClick={() => handleDepublier(categorie)}>
                        <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                      </button>
                    )}

                    <span className="crud-action-spacer" />

                    {categorie.statut === 'BROUILLON' && (
                      <button className="crud-action is-danger" type="button" onClick={() => demanderSuppression(categorie)}>
                        <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer
                      </button>
                    )}
                    {categorie.statut === 'ACTIF' && (
                      <button className="crud-action" type="button" onClick={() => setModal({ kind: 'confirm-archive-categorie', categorie })}>
                        <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                      </button>
                    )}
                    {categorie.statut === 'ARCHIVE' && (
                      <button className="crud-action" type="button" onClick={() => handleRestaurer(categorie)}>
                        <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Restaurer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
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

      {modal?.kind === 'categorie-form' && (
        <CategoryFormModal categorie={modal.categorie} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'categorie-apercu' && (
        <CategoryPreviewModal
          categorie={modal.categorie}
          produits={produits.filter((p) => p.categorieId === modal.categorie.id && p.statut === 'ACTIF')}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'categorie-detail' && (
        <ConfirmModal
          title={modal.categorie.nom}
          message={`Statut : ${STATUT_LABELS[modal.categorie.statut]} — ${produits.filter((p) => p.categorieId === modal.categorie.id).length} produit(s) associé(s).`}
          confirmLabel="Fermer"
          cancelLabel=""
          tone="info"
          icon="fa-circle-info"
          onConfirm={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive-categorie' && (
        <ConfirmModal
          title="Archiver cette catégorie ?"
          message={`« ${modal.categorie.nom} » sera retirée et déplacée dans les archives. Vous pourrez la restaurer plus tard depuis le filtre Archivés.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.categorie)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete-categorie' && (
        <ConfirmModal
          title="Supprimer cette catégorie ?"
          message={`« ${modal.categorie.nom} » sera définitivement supprimée. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.categorie)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'reassign-categorie' && (
        <ReassignCategoryModal
          categorie={modal.categorie}
          produitsConcernes={modal.produitsConcernes}
          autresCategories={modal.autresCategories}
          onConfirm={(targetId) => handleReaffecterEtSupprimer(modal.categorie, modal.produitsConcernes, targetId)}
          onClose={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
