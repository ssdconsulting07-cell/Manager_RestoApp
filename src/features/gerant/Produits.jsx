import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import ProductFormModal from './ProductFormModal.jsx'
import ProductPreviewModal from './ProductPreviewModal.jsx'
import { useMenuData } from './MenuDataContext.jsx'
import { STATUT_LABELS, countByStatut } from './menuData.js'

const FILTER_DEFS = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function Produits() {
  const {
    produits,
    categorieNomParId,
    categoriesSelectionnables,
    majStatutProduit,
    toggleDisponibiliteProduit,
    creerProduit,
    modifierProduit,
    supprimerProduit,
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

  const counts = useMemo(() => countByStatut(produits), [produits])
  const filtres = useMemo(() => {
    const query = search.trim().toLowerCase()
    return produits
      .filter((p) => p.statut === filter)
      .filter((p) => !query || p.nom.toLowerCase().includes(query) || categorieNomParId(p.categorieId).toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produits, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtres.length / rows))
  const visibles = filtres.slice((page - 1) * rows, page * rows)

  function handlePublier(produit) {
    majStatutProduit(produit.id, 'ACTIF')
    notify('success', `« ${produit.nom} » publié.`)
  }

  function handleDepublier(produit) {
    majStatutProduit(produit.id, 'BROUILLON')
    notify('success', `« ${produit.nom} » dépublié et repassé en brouillon.`)
  }

  function handleArchiver(produit) {
    majStatutProduit(produit.id, 'ARCHIVE')
    notify('success', `« ${produit.nom} » archivé.`)
    setModal(null)
  }

  function handleRestaurer(produit) {
    majStatutProduit(produit.id, 'BROUILLON')
    notify('success', `« ${produit.nom} » restauré en brouillon.`)
  }

  function handleToggleDispo(produit) {
    const nouvelleDispo = produit.disponibilite === 'EN_STOCK' ? 'RUPTURE' : 'EN_STOCK'
    toggleDisponibiliteProduit(produit.id)
    notify('success', nouvelleDispo === 'RUPTURE' ? `« ${produit.nom} » marqué en rupture.` : `« ${produit.nom} » remis en stock.`)
  }

  function handleSave(data) {
    if (modal?.kind === 'produit-form' && modal.produit) {
      modifierProduit(modal.produit.id, data)
      notify('success', `« ${data.nom} » mis à jour.`)
    } else {
      creerProduit(data)
      notify('success', `« ${data.nom} » créé en brouillon.`)
    }
    setModal(null)
  }

  function handleSupprimer(produit) {
    supprimerProduit(produit.id)
    notify('success', `« ${produit.nom} » supprimé.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Produits</h1>
          <p>Gérez les produits du menu, de leur création à leur publication côté client.</p>
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
              placeholder="Rechercher un produit ou une catégorie…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'produit-form', produit: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter un produit
          </button>
        </div>

        {visibles.length === 0 && (
          <p className="crud-empty">Aucun produit {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
        )}

        <div className="crud-grid">
          {visibles.map((produit) => (
            <article className="crud-grid-card" key={produit.id}>
              <div className="crud-grid-photo">
                {produit.photoUrl ? <img src={produit.photoUrl} alt="" /> : <i className="fa-solid fa-image" aria-hidden="true" />}
                <StatusBadge statut={produit.statut} label={STATUT_LABELS[produit.statut]} />
                {produit.statut === 'ACTIF' && (
                  <span className={`crud-grid-availability-chip ${produit.disponibilite === 'RUPTURE' ? 'is-rupture' : 'is-stock'}`}>
                    <i className={`fa-solid ${produit.disponibilite === 'RUPTURE' ? 'fa-ban' : 'fa-check'}`} aria-hidden="true" />
                    {produit.disponibilite === 'RUPTURE' ? 'Rupture' : 'En stock'}
                  </span>
                )}
              </div>

              <div className="crud-grid-body">
                <h3 className="crud-grid-title">{produit.nom}</h3>
                <div className="crud-grid-meta">
                  <span><i className="fa-solid fa-tag" aria-hidden="true" /> {categorieNomParId(produit.categorieId)}</span>
                </div>
                <strong className="crud-grid-price">{produit.prix.toLocaleString('fr-FR')} F CFA</strong>

                <div className="crud-card-actions crud-grid-footer">
                  <button className="crud-action" type="button" onClick={() => setModal({ kind: 'produit-detail', produit })}>
                    <i className="fa-solid fa-eye" aria-hidden="true" /> Voir
                  </button>

                  {(produit.statut === 'ACTIF' || produit.statut === 'BROUILLON') && (
                    <button className="crud-action" type="button" onClick={() => setModal({ kind: 'produit-apercu', produit })}>
                      <i className="fa-solid fa-image" aria-hidden="true" /> Aperçu
                    </button>
                  )}

                  {produit.statut === 'BROUILLON' && (
                    <>
                      <button className="crud-action" type="button" onClick={() => setModal({ kind: 'produit-form', produit })}>
                        <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                      </button>
                      <button className="crud-action is-publish" type="button" onClick={() => handlePublier(produit)}>
                        <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                      </button>
                    </>
                  )}

                  {produit.statut === 'ACTIF' && (
                    <>
                      <button className="crud-action" type="button" onClick={() => handleToggleDispo(produit)}>
                        <i className={`fa-solid ${produit.disponibilite === 'RUPTURE' ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                        {produit.disponibilite === 'RUPTURE' ? 'Remettre en stock' : 'Marquer en rupture'}
                      </button>
                      <button className="crud-action" type="button" onClick={() => handleDepublier(produit)}>
                        <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                      </button>
                    </>
                  )}

                  <span className="crud-action-spacer" />

                  {produit.statut === 'BROUILLON' && (
                    <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'confirm-delete-produit', produit })}>
                      <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer
                    </button>
                  )}
                  {produit.statut === 'ACTIF' && (
                    <button className="crud-action" type="button" onClick={() => setModal({ kind: 'confirm-archive-produit', produit })}>
                      <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                    </button>
                  )}
                  {produit.statut === 'ARCHIVE' && (
                    <button className="crud-action" type="button" onClick={() => handleRestaurer(produit)}>
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
          totalItems={filtres.length}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      {modal?.kind === 'produit-form' && (
        <ProductFormModal
          produit={modal.produit}
          categories={categoriesSelectionnables}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'produit-apercu' && (
        <ProductPreviewModal
          produit={modal.produit}
          categorieNom={categorieNomParId(modal.produit.categorieId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'produit-detail' && (
        <ConfirmModal
          title={modal.produit.nom}
          message={`${modal.produit.description || 'Aucune description.'} — ${modal.produit.prix.toLocaleString('fr-FR')} F CFA — Catégorie : ${categorieNomParId(modal.produit.categorieId)} — Statut : ${STATUT_LABELS[modal.produit.statut]}.`}
          confirmLabel="Fermer"
          cancelLabel=""
          tone="info"
          icon="fa-circle-info"
          onConfirm={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete-produit' && (
        <ConfirmModal
          title="Supprimer ce produit ?"
          message={`« ${modal.produit.nom} » sera définitivement supprimé. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.produit)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive-produit' && (
        <ConfirmModal
          title="Archiver ce produit ?"
          message={`« ${modal.produit.nom} » sera retiré de la vente et déplacé dans les archives. Vous pourrez le restaurer plus tard depuis le filtre Archivés.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.produit)}
          onCancel={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
