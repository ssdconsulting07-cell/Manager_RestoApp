import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import AccompagnementCondimentFormModal from './AccompagnementCondimentFormModal.jsx'
import { useAccompagnementsCondiments } from './AccompagnementsCondimentsContext.jsx'
import { STATUT_LABELS, TYPE_LABELS, typeIcon, countByStatut } from './accompagnementsCondimentsData.js'

// Page "Accompagnement & condiment" (Gerant, 24/10/2026) - fiches
// independantes du catalogue Produits : ce sont les choix proposes a la
// caisse pour un produit commande (frites, salade, mayonnaise, ketchup...),
// combines sur une seule page (demande du 24/10/2026) plutot que deux pages
// separees. Meme pattern que Produits.jsx/PlatsDuJour.jsx (StatFilterCards
// Actifs/Brouillons/Archives, grille de cartes, pagination) - voir
// brainstorming-chez-ketchup.md. Donnees partagees via
// AccompagnementsCondimentsContext.jsx pour que Vente.jsx (Vendeur) voie
// immediatement les fiches publiees ici.
const FILTER_DEFS = [
  { key: 'ACTIF', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'BROUILLON', label: 'Brouillons', icon: 'fa-pen-to-square', accent: '#9c6b0c', accentBg: '#f6ecd9' },
  { key: 'ARCHIVE', label: 'Archivés', icon: 'fa-box-archive', accent: '#5b5b5f', accentBg: '#ececea' },
]

const ROWS_OPTIONS = [5, 10, 25]

export default function AccompagnementsCondiments() {
  const { items, majStatut, creerItem, modifierItem, supprimerItem } = useAccompagnementsCondiments()
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

  const counts = useMemo(() => countByStatut(items), [items])
  const filtres = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((i) => i.statut === filter)
      .filter((i) => !query || i.nom.toLowerCase().includes(query) || TYPE_LABELS[i.type].toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, search])
  const pageCount = Math.max(1, Math.ceil(filtres.length / rows))
  const visibles = filtres.slice((page - 1) * rows, page * rows)

  function handlePublier(item) {
    majStatut(item.id, 'ACTIF')
    notify('success', `« ${item.nom} » publié.`)
  }

  function handleDepublier(item) {
    majStatut(item.id, 'BROUILLON')
    notify('success', `« ${item.nom} » dépublié et repassé en brouillon.`)
    setModal(null)
  }

  function handleArchiver(item) {
    majStatut(item.id, 'ARCHIVE')
    notify('success', `« ${item.nom} » archivé.`)
    setModal(null)
  }

  function handleRestaurer(item) {
    majStatut(item.id, 'BROUILLON')
    notify('success', `« ${item.nom} » restauré en brouillon.`)
    setModal(null)
  }

  function handleSave(data) {
    if (modal?.kind === 'item-form' && modal.item) {
      modifierItem(modal.item.id, data)
      notify('success', `« ${data.nom} » mis à jour.`)
    } else {
      const nouveau = creerItem(data)
      notify('success', nouveau.statut === 'ACTIF' ? `« ${data.nom} » créé et publié.` : `« ${data.nom} » créé en brouillon.`)
    }
    setModal(null)
  }

  function handleSupprimer(item) {
    supprimerItem(item.id)
    notify('success', `« ${item.nom} » supprimé.`)
    setModal(null)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Accompagnement & condiment</h1>
          <p>Gérez les choix proposés à la caisse pour un produit commandé — frites, salade, mayonnaise, ketchup…</p>
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
              placeholder="Rechercher un accompagnement ou un condiment…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'item-form', item: null })}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une fiche
          </button>
        </div>

        {visibles.length === 0 && (
          <p className="crud-empty">Aucune fiche {STATUT_LABELS[filter].toLowerCase()} pour le moment.</p>
        )}

        <div className="crud-grid">
          {visibles.map((item) => (
            <article className="crud-grid-card" key={item.id}>
              <div className="crud-grid-photo">
                <i className={`fa-solid ${typeIcon(item.type)}`} aria-hidden="true" />
                <StatusBadge statut={item.statut} label={STATUT_LABELS[item.statut]} />
                <div className="crud-product-highlight-badges">
                  <span className={`crud-product-highlight ${item.type === 'CONDIMENT' ? 'is-condiment' : 'is-accompagnement'}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
              </div>

              <div className="crud-grid-body">
                <h3 className="crud-grid-title">{item.nom}</h3>
                <strong className="crud-grid-price">
                  {item.prix > 0 ? `+${item.prix.toLocaleString('fr-FR')} F CFA` : 'Gratuit'}
                </strong>

                <div className="crud-card-actions crud-grid-footer">
                  {item.statut === 'BROUILLON' && (
                    <button className="crud-action is-publish" type="button" onClick={() => handlePublier(item)}>
                      <i className="fa-solid fa-upload" aria-hidden="true" /> Publier
                    </button>
                  )}
                  {item.statut !== 'ARCHIVE' && (
                    <button className="crud-action" type="button" onClick={() => setModal({ kind: 'item-form', item })}>
                      <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                    </button>
                  )}
                  {item.statut === 'ACTIF' && (
                    <button className="crud-action is-accent-orange" type="button" onClick={() => setModal({ kind: 'confirm-depublier', item })}>
                      <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Dépublier
                    </button>
                  )}
                  {item.statut !== 'ARCHIVE' && (
                    <button className="crud-action is-accent-red" type="button" onClick={() => setModal({ kind: 'confirm-archive', item })}>
                      <i className="fa-solid fa-box-archive" aria-hidden="true" /> Archiver
                    </button>
                  )}
                  {item.statut === 'ARCHIVE' && (
                    <>
                      <button className="crud-action is-archive" type="button" onClick={() => setModal({ kind: 'confirm-restaurer', item })}>
                        <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Restaurer
                      </button>
                      <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'confirm-delete', item })}>
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

      {modal?.kind === 'item-form' && (
        <AccompagnementCondimentFormModal
          item={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-depublier' && (
        <ConfirmModal
          title="Dépublier cette fiche ?"
          message={`« ${modal.item.nom} » repassera en brouillon et ne sera plus proposé à la caisse.`}
          confirmLabel="Dépublier"
          tone="warning"
          icon="fa-eye-slash"
          onConfirm={() => handleDepublier(modal.item)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-archive' && (
        <ConfirmModal
          title="Archiver cette fiche ?"
          message={`« ${modal.item.nom} » sera archivée et retirée de la liste active.`}
          confirmLabel="Archiver"
          tone="danger"
          icon="fa-box-archive"
          onConfirm={() => handleArchiver(modal.item)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-restaurer' && (
        <ConfirmModal
          title="Restaurer cette fiche ?"
          message={`« ${modal.item.nom} » repassera en brouillon, modifiable avant republication.`}
          confirmLabel="Restaurer"
          tone="info"
          icon="fa-clock-rotate-left"
          onConfirm={() => handleRestaurer(modal.item)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'confirm-delete' && (
        <ConfirmModal
          title="Supprimer définitivement cette fiche ?"
          message={`« ${modal.item.nom} » sera supprimée sans possibilité de restauration.`}
          confirmLabel="Supprimer définitivement"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleSupprimer(modal.item)}
          onCancel={() => setModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
