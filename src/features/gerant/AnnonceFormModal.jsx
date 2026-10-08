import { useRef, useState } from 'react'
import ImageCropModal from './ImageCropModal.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { createSlideId } from './annonceData.js'

let nextTemporarySlideId = 1

function createEmptySlide() {
  return { id: `slide-temp-${nextTemporarySlideId++}`, titre: '', message: '', imageUrl: '' }
}

export default function AnnonceFormModal({ annonce, onSave, onClose }) {
  const isEdit = Boolean(annonce)
  const [titre, setTitre] = useState(annonce?.titre || '')
  const [slides, setSlides] = useState(() => {
    if (annonce?.slides?.length) return annonce.slides.map((slide) => ({ ...slide }))
    if (annonce) return [{ id: `slide-${annonce.id}`, titre: annonce.titre, message: annonce.message || '', imageUrl: annonce.imageUrl || '' }]
    return [createEmptySlide()]
  })
  const [dragOverSlideId, setDragOverSlideId] = useState(null)
  const [cropSource, setCropSource] = useState(null)
  const [cropTargetId, setCropTargetId] = useState(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const fileInputRefs = useRef({})
  const initialValues = useRef({
    titre: annonce?.titre || '',
    slides: slides.map((slide) => ({ ...slide })),
  })

  const isDirty =
    titre !== initialValues.current.titre ||
    JSON.stringify(slides) !== JSON.stringify(initialValues.current.slides)

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  function applyFile(file, slideId) {
    if (!file || !file.type.startsWith('image/')) return
    setCropSource(URL.createObjectURL(file))
    setCropTargetId(slideId)
  }

  function handleInputChange(e, slideId) {
    applyFile(e.target.files?.[0], slideId)
    e.target.value = ''
  }

  function handleDrop(e, slideId) {
    e.preventDefault()
    setDragOverSlideId(null)
    applyFile(e.dataTransfer.files?.[0], slideId)
  }

  function updateSlide(slideId, field, value) {
    setSlides((current) => current.map((slide) => (
      slide.id === slideId ? { ...slide, [field]: value } : slide
    )))
  }

  function handleRemoveImage(e, slide) {
    e.stopPropagation()
    if (slide.imageUrl.startsWith('blob:')) URL.revokeObjectURL(slide.imageUrl)
    updateSlide(slide.id, 'imageUrl', '')
    if (fileInputRefs.current[slide.id]) fileInputRefs.current[slide.id].value = ''
  }

  function handleRecadrer(e, slide) {
    e.stopPropagation()
    setCropSource(slide.imageUrl)
    setCropTargetId(slide.id)
  }

  function handleCropConfirm(croppedUrl) {
    const currentSlide = slides.find((slide) => slide.id === cropTargetId)
    if (currentSlide?.imageUrl.startsWith('blob:') && currentSlide.imageUrl !== cropSource) URL.revokeObjectURL(currentSlide.imageUrl)
    if (cropSource && cropSource.startsWith('blob:')) URL.revokeObjectURL(cropSource)
    updateSlide(cropTargetId, 'imageUrl', croppedUrl)
    setCropSource(null)
    setCropTargetId(null)
  }

  function handleCropCancel() {
    const isCurrentImage = slides.some((slide) => slide.imageUrl === cropSource)
    if (cropSource && cropSource.startsWith('blob:') && !isCurrentImage) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    setCropTargetId(null)
  }

  function moveSlide(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= slides.length) return
    setSlides((current) => {
      const reordered = [...current]
      const [slide] = reordered.splice(index, 1)
      reordered.splice(targetIndex, 0, slide)
      return reordered
    })
  }

  function removeSlide(slide) {
    if (slides.length <= 1) return
    if (slide.imageUrl.startsWith('blob:')) URL.revokeObjectURL(slide.imageUrl)
    setSlides((current) => current.filter((item) => item.id !== slide.id))
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      titre: titre.trim(),
      slides: slides.map((slide) => ({
        ...slide,
        id: slide.id.startsWith('slide-temp-') ? createSlideId() : slide.id,
        titre: slide.titre.trim(),
        message: slide.message.trim(),
      })),
    }
    if (!isEdit) {
      payload.statut = e.nativeEvent.submitter?.value || 'BROUILLON'
    }
    onSave(payload)
  }

  const canSubmit = Boolean(titre.trim()) && slides.every((slide) => slide.titre.trim())

  return (
    <>
      <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
        <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="annonce-modal-title">
          <div className="manager-modal-header">
            <div>
              <p className="manager-eyebrow">{isEdit ? 'Modifier la chaîne' : 'Nouvelle chaîne'}</p>
              <h2 id="annonce-modal-title">{isEdit ? annonce.titre : 'Créer une chaîne'}</h2>
            </div>
            <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <form className="manager-modal-form crud-product-form" onSubmit={submit}>
            <label className="crud-annonce-chain-title">
              Nom de la chaîne
              <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Nouveautés de la semaine" required />
            </label>

            <div className="crud-annonce-slides-heading">
              <div><h3>Slides du carrousel</h3><span>{slides.length} slide{slides.length > 1 ? 's' : ''}</span></div>
              <button className="manager-button manager-button-quiet" type="button" onClick={() => setSlides((current) => [...current, createEmptySlide()])}>
                <i className="fa-solid fa-plus" aria-hidden="true" /> Ajouter une slide
              </button>
            </div>

            <div className="crud-annonce-slides">
              {slides.map((slide, index) => (
                <article className="crud-annonce-slide-editor" key={slide.id}>
                  <div className="crud-annonce-slide-heading">
                    <h4>Slide {index + 1}</h4>
                    <div>
                      <button className="manager-icon-button" type="button" aria-label={`Monter la slide ${index + 1}`} disabled={index === 0} onClick={() => moveSlide(index, -1)}>
                        <i className="fa-solid fa-arrow-up" aria-hidden="true" />
                      </button>
                      <button className="manager-icon-button" type="button" aria-label={`Descendre la slide ${index + 1}`} disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)}>
                        <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                      </button>
                      <button className="manager-icon-button" type="button" aria-label={`Supprimer la slide ${index + 1}`} disabled={slides.length === 1} onClick={() => removeSlide(slide)}>
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="crud-annonce-slide-fields">
                    <div className="crud-dropzone-field">
                      <span>Visuel (optionnel)</span>
                      <div
                        className={`crud-dropzone ${slide.imageUrl ? 'has-image' : ''} ${dragOverSlideId === slide.id ? 'is-dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverSlideId(slide.id) }}
                        onDragLeave={() => setDragOverSlideId(null)}
                        onDrop={(e) => handleDrop(e, slide.id)}
                        onClick={() => fileInputRefs.current[slide.id]?.click()}
                      >
                        {slide.imageUrl ? (
                          <div className="crud-dropzone-preview">
                            <img src={slide.imageUrl} alt="" />
                            <div className="crud-dropzone-preview-actions">
                              {slide.imageUrl.startsWith('blob:') && (
                                <button className="crud-dropzone-action" type="button" aria-label="Recadrer l'image" onClick={(e) => handleRecadrer(e, slide)}>
                                  <i className="fa-solid fa-crop-simple" aria-hidden="true" />
                                </button>
                              )}
                              <button className="crud-dropzone-action" type="button" aria-label="Retirer l'image" onClick={(e) => handleRemoveImage(e, slide)}>
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="crud-dropzone-text"><i className="fa-solid fa-cloud-arrow-up crud-dropzone-icon" aria-hidden="true" /><strong>Ajouter une image</strong><span>Glissez-déposez ou cliquez</span></span>
                        )}
                        <input ref={(node) => { fileInputRefs.current[slide.id] = node }} type="file" accept="image/*" onChange={(e) => handleInputChange(e, slide.id)} />
                      </div>
                    </div>
                    <div className="crud-product-form-fields">
                      <label>Titre de la slide<input type="text" value={slide.titre} onChange={(e) => updateSlide(slide.id, 'titre', e.target.value)} placeholder="Ex : Nouveau burger disponible !" required /></label>
                      <label>Message<textarea rows={3} value={slide.message} onChange={(e) => updateSlide(slide.id, 'message', e.target.value)} placeholder="Texte court affiché sous le titre (optionnel)…" /></label>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="manager-modal-actions">
              <button className="manager-button manager-button-quiet" type="button" onClick={requestClose}>Annuler</button>
              {isEdit ? (
                <button className="manager-button manager-button-primary" type="submit" disabled={!canSubmit}>
                  Enregistrer
                </button>
              ) : (
                <>
                  <button className="manager-button manager-button-warning" type="submit" value="BROUILLON" disabled={!canSubmit}>
                    Enregistrer en brouillon
                  </button>
                  <button className="manager-button manager-button-primary" type="submit" value="ACTIF" disabled={!canSubmit}>
                    Publier
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </div>

      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          aspect={4 / 5}
          eyebrow="Visuel de la slide"
          title="Recadrer l'affiche"
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmModal
          title="Quitter sans enregistrer ?"
          message="Les modifications apportées à cette annonce seront perdues."
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
