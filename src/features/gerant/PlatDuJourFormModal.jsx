import { useRef, useState } from 'react'
import ImageCropModal from './ImageCropModal.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import AideFormulaire from '../../components/crud/AideFormulaire.jsx'
import { JOURS_SEMAINE, joursDuPlat, servicesDuPlat } from './platsDuJourData.js'

export default function PlatDuJourFormModal({ plat, onSave, onClose }) {
  const isEdit = Boolean(plat)
  const [nom, setNom] = useState(plat?.nom || '')
  const [description, setDescription] = useState(plat?.description || '')
  const [prix, setPrix] = useState(plat?.prix ? String(plat.prix) : '')
  const [jours, setJours] = useState(plat ? joursDuPlat(plat) : [JOURS_SEMAINE[0].id])
  const [dejeuner, setDejeuner] = useState(plat ? servicesDuPlat(plat).dejeuner : true)
  const [diner, setDiner] = useState(plat ? servicesDuPlat(plat).diner : false)
  const [photoUrl, setPhotoUrl] = useState(plat?.photoUrl || '')
  const [isDragOver, setIsDragOver] = useState(false)
  const [cropSource, setCropSource] = useState(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const fileInputRef = useRef(null)
  const initialValues = useRef({
    nom: plat?.nom || '',
    description: plat?.description || '',
    prix: plat?.prix ? String(plat.prix) : '',
    jours: (plat ? joursDuPlat(plat) : [JOURS_SEMAINE[0].id]).join(),
    dejeuner: plat ? servicesDuPlat(plat).dejeuner : true,
    diner: plat ? servicesDuPlat(plat).diner : false,
    photoUrl: plat?.photoUrl || '',
  })

  const isDirty =
    nom !== initialValues.current.nom ||
    description !== initialValues.current.description ||
    prix !== initialValues.current.prix ||
    jours.join() !== initialValues.current.jours ||
    dejeuner !== initialValues.current.dejeuner ||
    diner !== initialValues.current.diner ||
    photoUrl !== initialValues.current.photoUrl

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

  function handleRemovePhoto(e) {
    e.stopPropagation()
    if (photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl)
    setPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRecadrer(e) {
    e.stopPropagation()
    setCropSource(photoUrl)
  }

  function handleCropConfirm(croppedUrl) {
    if (photoUrl && photoUrl.startsWith('blob:') && photoUrl !== cropSource) URL.revokeObjectURL(photoUrl)
    if (cropSource && cropSource.startsWith('blob:')) URL.revokeObjectURL(cropSource)
    setPhotoUrl(croppedUrl)
    setCropSource(null)
  }

  function handleCropCancel() {
    if (cropSource && cropSource.startsWith('blob:') && cropSource !== photoUrl) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      nom: nom.trim(),
      description: description.trim(),
      prix: Number(prix),
      // jour : ancien champ (premier jour), garde pour les versions precedentes de l'API.
      jour: JOURS_SEMAINE.map((j) => j.id).find((id) => jours.includes(id)),
      jours: JOURS_SEMAINE.map((j) => j.id).filter((id) => jours.includes(id)),
      dejeuner,
      diner,
      photoUrl,
    }
    if (!isEdit) {
      payload.statut = e.nativeEvent.submitter?.value || 'BROUILLON'
    }
    onSave(payload)
  }

  const basculerJour = (id) => setJours((j) => (j.includes(id) ? j.filter((x) => x !== id) : [...j, id]))
  const canSubmit = Boolean(nom.trim()) && Number(prix) > 0 && jours.length > 0 && (dejeuner || diner)
  const manquants = [
    !nom.trim() && 'le nom',
    !(Number(prix) > 0) && 'un prix',
    jours.length === 0 && 'au moins un jour',
    !dejeuner && !diner && 'le déjeuner, le dîner ou les deux',
  ]

  return (
    <>
      <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
        <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="plat-jour-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{isEdit ? 'Modifier le plat du jour' : 'Nouveau plat du jour'}</p>
            <h2 id="plat-jour-modal-title">{isEdit ? plat.nom : 'Ajouter un plat du jour'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form crud-product-form" onSubmit={submit}>
          <div className="crud-product-form-grid">
            <div className="crud-product-form-photo">
              <div className="crud-dropzone-field">
                <span>Photo</span>
                <div
                  className={`crud-dropzone ${photoUrl ? 'has-image' : ''} ${isDragOver ? 'is-dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoUrl ? (
                    <div className="crud-dropzone-preview">
                      <img src={photoUrl} alt="" />
                      <div className="crud-dropzone-preview-actions">
                        {photoUrl.startsWith('blob:') && (
                          <button
                            className="crud-dropzone-action"
                            type="button"
                            aria-label="Recadrer la photo"
                            onClick={handleRecadrer}
                          >
                            <i className="fa-solid fa-crop-simple" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          className="crud-dropzone-action"
                          type="button"
                          aria-label="Retirer la photo"
                          onClick={handleRemovePhoto}
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
                        <span>ou cliquez pour parcourir — JPG, PNG</span>
                      </span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div className="crud-product-form-fields">
              <label>
                Nom du plat
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Thiéboudienne"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingrédients, accompagnement, ce qui rend ce plat spécial…"
                />
              </label>

              <div className="crud-product-form-row">
                <label>
                  Prix (F CFA)
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    placeholder="3000"
                    required
                  />
                </label>

                <fieldset className="plat-choix">
                  <legend>Service</legend>
                  <div className="plat-choix-options">
                    <label className={`plat-choix-option ${dejeuner ? 'is-active' : ''}`}>
                      <input type="checkbox" checked={dejeuner} onChange={(e) => setDejeuner(e.target.checked)} />
                      <i className="fa-solid fa-sun" aria-hidden="true" /> Déjeuner
                    </label>
                    <label className={`plat-choix-option ${diner ? 'is-active' : ''}`}>
                      <input type="checkbox" checked={diner} onChange={(e) => setDiner(e.target.checked)} />
                      <i className="fa-solid fa-moon" aria-hidden="true" /> Dîner
                    </label>
                  </div>
                </fieldset>

                <fieldset className="plat-choix">
                  <legend>
                    Jours <span className="plat-choix-aide">— un ou plusieurs</span>
                  </legend>
                  <div className="plat-choix-options is-jours">
                    {JOURS_SEMAINE.map((j) => (
                      <label key={j.id} className={`plat-choix-option ${jours.includes(j.id) ? 'is-active' : ''}`}>
                        <input type="checkbox" checked={jours.includes(j.id)} onChange={() => basculerJour(j.id)} />
                        {j.nom}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="plat-choix-tous"
                    onClick={() => setJours(jours.length === 7 ? [] : JOURS_SEMAINE.map((j) => j.id))}
                  >
                    {jours.length === 7 ? 'Aucun jour' : 'Tous les jours'}
                  </button>
                </fieldset>
              </div>
            </div>
          </div>

          <AideFormulaire manquants={manquants} />
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
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmModal
          title="Quitter sans enregistrer ?"
          message="Les modifications apportées à ce plat du jour seront perdues."
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
