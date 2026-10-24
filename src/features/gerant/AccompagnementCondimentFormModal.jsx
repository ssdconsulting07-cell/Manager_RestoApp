import { useRef, useState } from 'react'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import { TYPES, TYPE_LABELS } from './accompagnementsCondimentsData.js'

// Formulaire volontairement plus simple que ProductFormModal/PlatDuJourFormModal
// (pas de photo) : un accompagnement/condiment est un simple choix propose a
// la caisse (voir AccompagnementModal.jsx cote Vendeur), pas une fiche a
// illustrer.
export default function AccompagnementCondimentFormModal({ item, onSave, onClose }) {
  const isEdit = Boolean(item)
  const [nom, setNom] = useState(item?.nom || '')
  const [type, setType] = useState(item?.type || TYPES.ACCOMPAGNEMENT)
  const [prix, setPrix] = useState(item?.prix !== undefined ? String(item.prix) : '')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const initialValues = useRef({
    nom: item?.nom || '',
    type: item?.type || TYPES.ACCOMPAGNEMENT,
    prix: item?.prix !== undefined ? String(item.prix) : '',
  })

  const isDirty =
    nom !== initialValues.current.nom ||
    type !== initialValues.current.type ||
    prix !== initialValues.current.prix

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      nom: nom.trim(),
      type,
      prix: Number(prix),
    }
    if (!isEdit) {
      payload.statut = e.nativeEvent.submitter?.value || 'BROUILLON'
    }
    onSave(payload)
  }

  const prixNombre = Number(prix)
  const canSubmit = Boolean(nom.trim()) && prix !== '' && !Number.isNaN(prixNombre) && prixNombre >= 0 && Boolean(type)

  return (
    <>
      <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
        <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="accomp-cond-modal-title">
          <div className="manager-modal-header">
            <div>
              <p className="manager-eyebrow">{isEdit ? 'Modifier la fiche' : 'Nouvelle fiche'}</p>
              <h2 id="accomp-cond-modal-title">{isEdit ? item.nom : 'Ajouter un accompagnement ou condiment'}</h2>
            </div>
            <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={requestClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <form className="manager-modal-form crud-product-form" onSubmit={submit}>
            <div className="crud-product-form-fields">
              <label>
                Nom
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Frites, Mayonnaise…"
                  required
                />
              </label>

              <div className="crud-product-form-row">
                <label>
                  Type
                  <select value={type} onChange={(e) => setType(e.target.value)} required>
                    {Object.values(TYPES).map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Prix (F CFA)
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    placeholder="0"
                    required
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

      {showDiscardConfirm && (
        <ConfirmModal
          title="Quitter sans enregistrer ?"
          message="Les modifications apportées à cette fiche seront perdues."
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
