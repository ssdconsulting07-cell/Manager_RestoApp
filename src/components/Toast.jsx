import { useEffect, useRef, useState } from 'react'

const TOAST_DURATION = {
  success: 3800,
  error: 5200,
  // 'info' : alerte neutre (ex. nouvelle commande en cuisine) — ni succes ni
  // erreur, visible un peu plus longtemps qu'un succes pour laisser le temps
  // de la remarquer sans avoir a interrompre une tâche en cours.
  info: 4500,
}

export default function Toast({ toast, onClose }) {
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const [remaining, setRemaining] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!toast) return undefined

    const duration = TOAST_DURATION[toast.type]
    setRemaining(duration)
    setPaused(false)
    startedAtRef.current = Date.now()
    timerRef.current = window.setTimeout(onClose, duration)

    return () => window.clearTimeout(timerRef.current)
  }, [toast, onClose])

  if (!toast) return null

  const isSuccess = toast.type === 'success'
  const isInfo = toast.type === 'info'
  const duration = TOAST_DURATION[toast.type]

  function pauseToast() {
    if (paused) return
    window.clearTimeout(timerRef.current)
    setRemaining((current) => Math.max(0, current - (Date.now() - startedAtRef.current)))
    setPaused(true)
  }

  function resumeToast() {
    if (!paused) return
    setRemaining((current) => {
      if (current <= 0) {
        onClose()
        return 0
      }
      startedAtRef.current = Date.now()
      timerRef.current = window.setTimeout(onClose, current)
      return current
    })
    setPaused(false)
  }

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <div
        className={`toast toast-${toast.type} ${paused ? 'is-paused' : ''}`}
        key={toast.id}
        role={isSuccess || isInfo ? 'status' : 'alert'}
        style={{ '--toast-duration': `${duration}ms` }}
        onMouseEnter={pauseToast}
        onMouseLeave={resumeToast}
      >
        <span className="toast-icon" aria-hidden="true">{isSuccess ? '✓' : isInfo ? '🔔' : '!'}</span>
        <p>{toast.message}</p>
        <button type="button" aria-label="Fermer la notification" onClick={onClose}>
          ×
        </button>
        <span className="toast-timeline" aria-hidden="true" />
      </div>
    </div>
  )
}