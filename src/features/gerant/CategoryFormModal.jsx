import { useState } from 'react'

export default function CategoryFormModal({ categorie, onSave, onClose }) {
  const isEdit = Boolean(categorie)
  const [nom, setNom] = useState(categorie?.nom || '')

  function submit(e) {
    e.preventDefault()
    onSave({ nom: nom.trim() })
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{isEdit ? 'Modifier le brouillon' : 'Nouvelle catégorie'}</p>
            <h2 id="category-modal-title">{isEdit ? categorie.nom : 'Ajouter une catégorie'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form" onSubmit={submit}>
          <label>
            Nom de la catégorie
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Burgers" required autoFocus />
          </label>
          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={!nom.trim()}>
              {isEdit ? 'Enregistrer' : 'Créer en brouillon'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
