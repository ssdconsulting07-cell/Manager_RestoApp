import { useState } from 'react'

// Rendu partage du popup "nouveaute" tel qu'il apparaitrait a l'arrivee sur
// l'app Client (sur le modele de Max It / Orange Money) — utilise par
// AnnoncePreviewModal (apercu statique depuis la page Annonces, bouton "Aperçu").
export default function AnnoncePopupPreview({ annonce, dismissible = false }) {
  const [closed, setClosed] = useState(false)

  if (closed) return null

  return (
    <div className="crud-annonce-popup">
      <div className="crud-annonce-popup-photo">
        {annonce.imageUrl ? (
          <img src={annonce.imageUrl} alt="" />
        ) : (
          <i className="fa-solid fa-bullhorn" aria-hidden="true" />
        )}
        <div className="crud-annonce-popup-scrim" aria-hidden="true" />
        <h3 className="crud-annonce-popup-title">{annonce.titre}</h3>
        {dismissible && (
          <button
            className="crud-annonce-popup-close"
            type="button"
            aria-label="Fermer"
            onClick={() => setClosed(true)}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        )}
      </div>
      {annonce.message && (
        <div className="crud-annonce-popup-body">
          <p>{annonce.message}</p>
        </div>
      )}
    </div>
  )
}
