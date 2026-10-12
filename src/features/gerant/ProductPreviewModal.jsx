export default function ProductPreviewModal({ produit, categorieNom, isPlatDuJour, onClose }) {
  const isRupture = produit.disponibilite === 'RUPTURE'

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal crud-preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Aperçu côté client</p>
            <h2 id="preview-modal-title">Rendu de la carte produit</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <article className="client-product-card">
          <div className="client-product-photo">
            {produit.photoUrl ? <img src={produit.photoUrl} alt="" /> : <i className="fa-solid fa-image" aria-hidden="true" />}
            {isRupture && <span className="client-product-rupture">Indisponible</span>}
          </div>
          <div className="client-product-body">
            {(produit.tendance || isPlatDuJour || produit.platDuJour) && (
              <div className="crud-product-highlight-badges is-preview">
                {produit.tendance && <span className="crud-product-highlight is-trending"><i className="fa-solid fa-fire" aria-hidden="true" /> Tendance</span>}
                {(isPlatDuJour || produit.platDuJour) && <span className="crud-product-highlight is-daily"><i className="fa-solid fa-calendar-day" aria-hidden="true" /> Plat du jour</span>}
              </div>
            )}
            <span className="client-product-category">{categorieNom}</span>
            <h3>{produit.nom}</h3>
            <p>{produit.description || 'Aucune description renseignée pour le moment.'}</p>
            <div className="client-product-footer">
              <strong>{produit.prix.toLocaleString('fr-FR')} F CFA</strong>
              <button className="manager-button manager-button-primary" type="button" disabled={isRupture}>
                {isRupture ? 'Indisponible' : 'Ajouter au panier'}
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
