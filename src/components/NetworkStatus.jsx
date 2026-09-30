import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api/client.js'
import Toast from './Toast.jsx'

const CHECK_INTERVAL_MS = 1000
const CHECK_TIMEOUT_MS = 1200
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
        await fetch(`${API_BASE_URL}/produits`, {
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

    window.addEventListener('offline', showOffline)
    window.addEventListener('online', showOnline)

    checkConnection()
    const timer = window.setInterval(checkConnection, CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener('offline', showOffline)
      window.removeEventListener('online', showOnline)
      window.clearInterval(timer)
    }
  }, [])

  return <Toast toast={toast} onClose={() => setToast(null)} />
}