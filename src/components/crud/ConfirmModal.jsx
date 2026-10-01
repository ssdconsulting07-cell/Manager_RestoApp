const TONE_BUTTON_CLASS = {
  info: 'manager-button-primary',
  warning: 'manager-button-warning',
  danger: 'manager-button-danger',
}

const TONE_ICON_CLASS = {
  info: '',
  warning: 'is-warning',
  danger: 'is-danger',
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  tone = 'info',
  icon = 'fa-circle-info',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <section className="manager-modal manager-modal-confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <span className={`crud-confirm-icon ${TONE_ICON_CLASS[tone] || ''}`} aria-hidden="true">
          <i className={`fa-solid ${icon}`} />
        </span>
        <h2 id="confirm-modal-title">{title}</h2>
        <p className="crud-confirm-message">{message}</p>
        <div className="manager-modal-actions">
          {cancelLabel && (
            <button className="manager-button manager-button-quiet" type="button" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button className={`manager-button ${TONE_BUTTON_CLASS[tone] || 'manager-button-primary'}`} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
