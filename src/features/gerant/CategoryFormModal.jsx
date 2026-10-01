import { useRef, useState } from 'react'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'

export default function CategoryFormModal({ categorie, onSave, onClose }) {
  const isEdit = Boolean(categorie)
  const [nom, setNom] = useState(categorie?.nom || '')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const initialNom = useRef(categorie?.nom || '')
  const isDirty = nom !== initialNom.current

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    onSave({ nom: nom.trim() })
  }

  return (
    <>
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{isEdit ? 'Modifier le brouillon' : 'Nouvelle catégorie'}</p>
            <h2 id="category-modal-title">{isEdit ? categorie.nom : 'Ajouter une catégorie'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form" onSubmit={submit}>
          <label>
            Nom de la catégorie
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Burgers" required autoFocus />
          </label>
          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={requestClose}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={!nom.trim()}>
              {isEdit ? 'Enregistrer' : 'Créer en brouillon'}
            </button>
          </div>
        </form>
      </section>
    </div>

    {showDiscardConfirm && (
      <ConfirmModal
        title="Quitter sans enregistrer ?"
        message="Les modifications apportées à cette catégorie seront perdues."
        confirmLabel="Quitter sans enregistrer"
        cancelLabel="Continuer l'édition"
        tone="danger"
        icon="fa-triangle-exclamation"
        onConfirm={onClose}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    )}
    </>
  )
}
