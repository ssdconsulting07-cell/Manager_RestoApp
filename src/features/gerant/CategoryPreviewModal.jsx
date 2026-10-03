export default function CategoryPreviewModal({ categorie, produits, onClose }) {
  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal crud-preview-modal" role="dialog" aria-modal="true" aria-labelledby="category-preview-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Aperçu côté client</p>
            <h2 id="category-preview-title">{categorie.nom}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        {produits.length === 0 ? (
          <p className="crud-confirm-message">
            Aucun produit actif dans cette catégorie pour le moment — elle n'apparaîtra pas encore côté client.
          </p>
        ) : (
          <ul className="crud-category-preview-list">
            {produits.map((p) => (
              <li key={p.id}>
                <span>{p.nom}</span>
                <strong>{p.prix.toLocaleString('fr-FR')} F CFA</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
