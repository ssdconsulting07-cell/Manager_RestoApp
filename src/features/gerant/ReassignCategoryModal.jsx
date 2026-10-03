import { useState } from 'react'

export default function ReassignCategoryModal({ categorie, produitsConcernes, autresCategories, onConfirm, onClose }) {
  const [targetId, setTargetId] = useState(autresCategories[0]?.id || '')
  const count = produitsConcernes.length

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="reassign-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Suppression impossible directement</p>
            <h2 id="reassign-modal-title">Réaffecter avant de supprimer « {categorie.nom} »</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <p className="crud-confirm-message">
          {count} produit{count > 1 ? 's' : ''} {count > 1 ? 'utilisent' : 'utilise'} encore cette catégorie.
          Choisissez une catégorie de remplacement pour les réaffecter avant de pouvoir supprimer « {categorie.nom} ».
        </p>
        {autresCategories.length === 0 ? (
          <p className="crud-confirm-message">
            <strong>Aucune autre catégorie disponible.</strong> Créez-en une autre avant de supprimer celle-ci.
          </p>
        ) : (
          <label>
            Réaffecter les produits vers
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {autresCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </label>
        )}
        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
          <button
            className="manager-button manager-button-danger"
            type="button"
            disabled={!targetId}
            onClick={() => onConfirm(targetId)}
          >
            Réaffecter et supprimer
          </button>
        </div>
      </section>
    </div>
  )
}
