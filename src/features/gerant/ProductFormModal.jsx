import { useRef, useState } from 'react'

export default function ProductFormModal({ produit, categories, onSave, onClose }) {
  const isEdit = Boolean(produit)
  const [nom, setNom] = useState(produit?.nom || '')
  const [description, setDescription] = useState(produit?.description || '')
  const [prix, setPrix] = useState(produit?.prix ? String(produit.prix) : '')
  const [categorieId, setCategorieId] = useState(produit?.categorieId || categories[0]?.id || '')
  const [disponibilite, setDisponibilite] = useState(produit?.disponibilite || 'EN_STOCK')
  const [photoUrl, setPhotoUrl] = useState(produit?.photoUrl || '')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  function applyFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setPhotoUrl(URL.createObjectURL(file))
  }

  function handleInputChange(e) {
    applyFile(e.target.files?.[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    applyFile(e.dataTransfer.files?.[0])
  }

  function handleRemovePhoto(e) {
    e.stopPropagation()
    setPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function submit(e) {
    e.preventDefault()
    onSave({
      nom: nom.trim(),
      description: description.trim(),
      prix: Number(prix),
      categorieId,
      disponibilite,
      photoUrl,
    })
  }

  const canSubmit = Boolean(nom.trim()) && Number(prix) > 0 && Boolean(categorieId)

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">{isEdit ? 'Modifier le brouillon' : 'Nouveau produit'}</p>
            <h2 id="product-modal-title">{isEdit ? produit.nom : 'Ajouter un produit'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form crud-product-form" onSubmit={submit}>
          <div className="crud-product-form-grid">
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
                    <button
                      className="crud-dropzone-remove"
                      type="button"
                      aria-label="Retirer la photo"
                      onClick={handleRemovePhoto}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
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

            <label>
              Nom du produit
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Ketchup Burger Classique"
                required
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingrédients, accompagnement, ce qui rend ce produit spécial…"
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
                  placeholder="3500"
                  required
                />
              </label>

              <label>
                Catégorie
                <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} required>
                  {categories.length === 0 && <option value="">Aucune catégorie disponible</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="crud-availability-field">
              <legend>Disponibilité</legend>
              <label className={`crud-radio-pill ${disponibilite === 'EN_STOCK' ? 'is-checked' : ''}`}>
                <input
                  type="radio"
                  name="disponibilite"
                  value="EN_STOCK"
                  checked={disponibilite === 'EN_STOCK'}
                  onChange={() => setDisponibilite('EN_STOCK')}
                />
                <i className="fa-solid fa-check" aria-hidden="true" /> En stock
              </label>
              <label className={`crud-radio-pill is-rupture ${disponibilite === 'RUPTURE' ? 'is-checked' : ''}`}>
                <input
                  type="radio"
                  name="disponibilite"
                  value="RUPTURE"
                  checked={disponibilite === 'RUPTURE'}
                  onChange={() => setDisponibilite('RUPTURE')}
                />
                <i className="fa-solid fa-ban" aria-hidden="true" /> Rupture
              </label>
            </fieldset>
          </div>

          <div className="manager-modal-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit" disabled={!canSubmit}>
              {isEdit ? 'Enregistrer' : 'Créer en brouillon'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
