import { useCallback, useEffect, useState } from 'react'
import Toast from './Toast.jsx'
import { ecouterErreursApi } from '../utils/alertes.js'

// Alerte globale des enregistrements refuses par le serveur (voir utils/alertes.js).
export default function AlertesApi() {
  const [toast, setToast] = useState(null)
  useEffect(() => ecouterErreursApi((message) => setToast({ id: Date.now(), type: 'error', message })), [])
  const fermer = useCallback(() => setToast(null), [])
  return <Toast toast={toast} onClose={fermer} />
}
