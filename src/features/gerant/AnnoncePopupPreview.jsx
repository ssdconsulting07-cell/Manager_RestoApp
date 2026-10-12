import { useMemo, useState } from 'react'

// Rendu partage du popup "nouveaute" tel qu'il apparaitrait a l'arrivee sur
// l'app Client (sur le modele de Max It / Orange Money) — utilise par
// AnnoncePreviewModal (apercu statique depuis la page Annonces, bouton "Aperçu").
export default function AnnoncePopupPreview({ chaine, chainesActives = [], dismissible = false }) {
  const [closed, setClosed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const sequence = useMemo(() => {
    if (!chaine) return []
    const publishedChains = chainesActives.some((item) => item.id === chaine.id)
      ? chainesActives
      : [chaine]
    const selectedIndex = publishedChains.findIndex((item) => item.id === chaine.id)
    const orderedChains = selectedIndex < 0
      ? publishedChains
      : [...publishedChains.slice(selectedIndex), ...publishedChains.slice(0, selectedIndex)]
    return orderedChains.flatMap((item, chainIndex) => (
      item.slides.map((slide, slideIndex) => ({ chaine: item, slide, chainIndex, slideIndex }))
    ))
  }, [chaine, chainesActives])

  if (closed || sequence.length === 0) return null

  const currentIndex = activeIndex % sequence.length
  const current = sequence[currentIndex]
  const { chaine: currentChaine, slide } = current

  return (
    <div className="crud-annonce-popup">
      <div className="crud-annonce-popup-photo">
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt="" />
        ) : (
          <i className="fa-solid fa-bullhorn" aria-hidden="true" />
        )}
        <div className="crud-annonce-popup-scrim" aria-hidden="true" />
        <h3 className="crud-annonce-popup-title">{slide.titre}</h3>
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
      {slide.message && (
        <div className="crud-annonce-popup-body">
          <p>{slide.message}</p>
        </div>
      )}
      <div className="crud-annonce-carousel-controls" aria-label="Navigation du carrousel">
        <button type="button" aria-label="Slide précédente" disabled={sequence.length < 2} onClick={() => setActiveIndex((index) => (index - 1 + sequence.length) % sequence.length)}>
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <span title={currentChaine.titre}>{currentChaine.titre} · {currentIndex + 1}/{sequence.length}</span>
        <button type="button" aria-label="Slide suivante" disabled={sequence.length < 2} onClick={() => setActiveIndex((index) => (index + 1) % sequence.length)}>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
