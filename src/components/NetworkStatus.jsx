import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api/client.js'
import Toast from './Toast.jsx'

// 12s (et non 1s) : une sonde de connectivite n'a pas besoin d'etre plus
// reactive que l'oeil humain, et ca evite de solliciter le backend en
// continu pour chaque poste connecte. Le retour sur l'onglet (voir
// visibilitychange plus bas) et les evenements online/offline du navigateur
// compensent l'intervalle plus long en cas de coupure pendant que l'onglet
// etait en arriere-plan.
const CHECK_INTERVAL_MS = 12000
const CHECK_TIMEOUT_MS = 2500
const STABLE_CHECKS_REQUIRED = 2

export default function NetworkStatus() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let cancelled = false
    let status = 'unknown'
    let failureChecks = 0
    let successChecks = 0
    let checking = false

    function updateStatus(isOnline, immediate = false) {
      if (cancelled) return

      if (isOnline) {
        successChecks += 1
        failureChecks = 0
        if (status === 'offline' && (immediate || successChecks >= STABLE_CHECKS_REQUIRED)) {
          status = 'online'
          setToast({ id: Date.now(), type: 'success', message: 'Connexion rétablie.' })
        } else if (status === 'unknown' && successChecks >= STABLE_CHECKS_REQUIRED) {
          status = 'online'
        }
        return
      }

      failureChecks += 1
      successChecks = 0
      if (status === 'online' && (immediate || failureChecks >= STABLE_CHECKS_REQUIRED)) {
        status = 'offline'
        setToast({ id: Date.now(), type: 'error', message: 'Connexion instable. Vérifiez votre connexion internet.' })
      } else if (status === 'unknown' && failureChecks >= STABLE_CHECKS_REQUIRED) {
        status = 'offline'
        setToast({ id: Date.now(), type: 'error', message: 'Connexion instable. Vérifiez votre connexion internet.' })
      }
    }

    function showOffline() {
      updateStatus(false, true)
    }

    function showOnline() {
      checkConnection()
    }

    async function checkConnection() {
      if (cancelled || checking) return
      checking = true

      if (!navigator.onLine) {
        updateStatus(false)
        checking = false
        return
      }

      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

      try {
        // Sonde dediee (GET /health, sans acces base de donnees), pas un
        // endpoint metier : on ne veut pas payer une requete SQL a chaque
        // verification de connectivite.
        await fetch(`${API_BASE_URL}/health`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        updateStatus(true)
      } catch {
        updateStatus(false)
      } finally {
        window.clearTimeout(timeout)
        checking = false
      }
    }

    function handleVisibility() {
      // Les navigateurs throttlent fortement les setInterval d'un onglet en
      // arriere-plan : sans ce hook, une coupure survenue pendant que
      // l'onglet etait cache ne serait detectee qu'au prochain tick throttle,
      // parfois bien plus tard que CHECK_INTERVAL_MS.
      if (document.visibilityState === 'visible') {
        checkConnection()
      }
    }

    window.addEventListener('offline', showOffline)
    window.addEventListener('online', showOnline)
    document.addEventListener('visibilitychange', handleVisibility)

    checkConnection()
    const timer = window.setInterval(checkConnection, CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener('offline', showOffline)
      window.removeEventListener('online', showOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(timer)
    }
  }, [])

  return <Toast toast={toast} onClose={() => setToast(null)} />
}