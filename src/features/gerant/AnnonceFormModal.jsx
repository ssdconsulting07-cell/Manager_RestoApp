import { useRef, useState } from 'react'
import ImageCropModal from './ImageCropModal.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'

export default function AnnonceFormModal({ annonce, onSave, onClose }) {
  const isEdit = Boolean(annonce)
  const [titre, setTitre] = useState(annonce?.titre || '')
  const [message, setMessage] = useState(annonce?.message || '')
  const [imageUrl, setImageUrl] = useState(annonce?.imageUrl || '')
  const [isDragOver, setIsDragOver] = useState(false)
  const [cropSource, setCropSource] = useState(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const fileInputRef = useRef(null)
  const initialValues = useRef({
    titre: annonce?.titre || '',
    message: annonce?.message || '',
    imageUrl: annonce?.imageUrl || '',
  })

  const isDirty =
    titre !== initialValues.current.titre ||
    message !== initialValues.current.message ||
    imageUrl !== initialValues.current.imageUrl

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  function applyFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setCropSource(URL.createObjectURL(file))
  }

  function handleInputChange(e) {
    applyFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    applyFile(e.dataTransfer.files?.[0])
  }

  function handleRemoveImage(e) {
    e.stopPropagation()
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    setImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRecadrer(e) {
    e.stopPropagation()
    setCropSource(imageUrl)
  }

  function handleCropConfirm(croppedUrl) {
    if (imageUrl && imageUrl.startsWith('blob:') && imageUrl !== cropSource) URL.revokeObjectURL(imageUrl)
    if (cropSource && cropSource.startsWith('blob:')) URL.revokeObjectURL(cropSource)
    setImageUrl(croppedUrl)
    setCropSource(null)
  }

  function handleCropCancel() {
    if (cropSource && cropSource.startsWith('blob:') && cropSource !== imageUrl) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  function submit(e) {
    e.preventDefault()
    const payload = { titre: titre.trim(), message: message.trim(), imageUrl }
    // Meme pattern que ProductFormModal : en creation, deux boutons de
    // soumission (Publier / Enregistrer en brouillon) portent le statut
    // vise ; en edition, le statut existant n'est jamais change depuis ce
    // formulaire (voir AnnoncesContext.publierAnnonce pour la regle
    // "une seule annonce active a la fois").
    if (!isEdit) {
      payload.statut = e.nativeEvent.submitter?.value || 'BROUILLON'
    }
    onSave(payload)
  }

  const canSubmit = Boolean(titre.trim())

  return (
    <>
      <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
        <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="annonce-modal-title">
          <div className="manager-modal-header">
            <div>
              <p className="manager-eyebrow">{isEdit ? 'Modifier le brouillon' : 'Nouvelle annonce'}</p>
              <h2 id="annonce-modal-title">{isEdit ? annonce.titre : 'Ajouter une annonce'}</h2>
            </div>
            <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <form className="manager-modal-form crud-product-form" onSubmit={submit}>
            <div className="crud-product-form-grid">
              <div className="crud-product-form-photo">
                <div className="crud-dropzone-field">
                  <span>Image de l'annonce (optionnelle)</span>
                  <div
                    className={`crud-dropzone ${imageUrl ? 'has-image' : ''} ${isDragOver ? 'is-dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUrl ? (
                      <div className="crud-dropzone-preview">
                        <img src={imageUrl} alt="" />
                        <div className="crud-dropzone-preview-actions">
                          {imageUrl.startsWith('blob:') && (
                            <button
                              className="crud-dropzone-action"
                              type="button"
                              aria-label="Recadrer l'image"
                              onClick={handleRecadrer}
                            >
                              <i className="fa-solid fa-crop-simple" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            className="crud-dropzone-action"
                            type="button"
                            aria-label="Retirer l'image"
                            onClick={handleRemoveImage}
                          >
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up crud-dropzone-icon" aria-hidden="true" />
                        <span className="crud-dropzone-text">
                          <strong>Glissez-déposez une image</strong>
                          <span>ou cliquez pour parcourir — JPG, PNG (format portrait recommandé)</span>
                        </span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="crud-product-form-fields">
                <label>
                  Titre
                  <input
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex : Nouveau burger disponible !"
                    required
                  />
                </label>

                <label>
                  Message
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Texte court affiché sous le titre (optionnel)…"
                  />
                </label>
              </div>
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
          eyebrow="Image de l'annonce"
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
