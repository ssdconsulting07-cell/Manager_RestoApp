import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImageUrl } from './cropImage.js'

export default function ImageCropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleValider() {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    setError('')
    try {
      const url = await getCroppedImageUrl(imageSrc, croppedAreaPixels)
      onConfirm(url)
    } catch {
      setError('Le recadrage a échoué. Réessayez ou choisissez une autre image.')
      setIsSaving(false)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <section className="manager-modal manager-modal-wide crud-crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Photo du produit</p>
            <h2 id="crop-modal-title">Recadrer la photo</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onCancel}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="crud-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="crud-crop-zoom">
          <i className="fa-solid fa-magnifying-glass-minus" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
          <i className="fa-solid fa-magnifying-glass-plus" aria-hidden="true" />
        </div>

        {error && <p className="crud-crop-error">{error}</p>}

        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={onCancel} disabled={isSaving}>
            Annuler
          </button>
          <button className="manager-button manager-button-primary" type="button" onClick={handleValider} disabled={isSaving || !croppedAreaPixels}>
            {isSaving ? 'Recadrage…' : 'Valider le recadrage'}
          </button>
        </div>
      </section>
    </div>
  )
}
