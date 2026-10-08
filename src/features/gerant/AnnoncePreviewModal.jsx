import AnnoncePopupPreview from './AnnoncePopupPreview.jsx'

export default function AnnoncePreviewModal({ chaine, chainesActives, onClose }) {
  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal crud-preview-modal" role="dialog" aria-modal="true" aria-labelledby="annonce-preview-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Aperçu côté client</p>
            <h2 id="annonce-preview-title">Carrousel des chaînes publiées</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <AnnoncePopupPreview chaine={chaine} chainesActives={chainesActives} dismissible />
      </section>
    </div>
  )
}
