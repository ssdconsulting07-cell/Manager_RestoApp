import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  apiPost,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
  SESSION_EXPIRED_EVENT,
} from '../api/client.js'
import { isKnownRole } from './roles.js'

// Session du staff : token JWT (gere par api/client.js) + role renvoye par /auth/login.
const ROLE_KEY = 'senyummies_manager_role'
const USERNAME_KEY = 'senyummies_manager_username'
const LAST_LOGIN_KEY = 'senyummies_manager_last_login'
const PREVIOUS_LOGIN_KEY = 'senyummies_manager_previous_login'

const AuthContext = createContext(null)

function readStoredRole() {
  const role = localStorage.getItem(ROLE_KEY)
  return getAuthToken() && isKnownRole(role) ? role : null
}

function readStoredUsername() {
  return localStorage.getItem(USERNAME_KEY) || ''
}

function readStoredLastLogin() {
  return localStorage.getItem(PREVIOUS_LOGIN_KEY) || localStorage.getItem(LAST_LOGIN_KEY) || null
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(readStoredRole)
  const [username, setUsername] = useState(readStoredUsername)
  const [lastLoginAt, setLastLoginAt] = useState(readStoredLastLogin)

  const logout = useCallback(() => {
    clearAuthToken()
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(LAST_LOGIN_KEY)
    localStorage.removeItem(PREVIOUS_LOGIN_KEY)
    setRole(null)
    setUsername('')
    setLastLoginAt(null)
  }, [])

  const login = useCallback(async (username, password) => {
    // Un ancien token ne doit pas accompagner la tentative de connexion.
    clearAuthToken()
    const response = await apiPost('/auth/login', { username, password })
    if (response?.mustChangePassword) {
      return { mustChangePassword: true, role: response.role }
    }

    const { token, role: receivedRole } = response || {}
    if (!token || !isKnownRole(receivedRole)) {
      throw new Error('Réponse de connexion inattendue du serveur.')
    }

    const normalizedUsername = username.trim()
    setAuthToken(token)
    const previousLogin = localStorage.getItem(LAST_LOGIN_KEY)
    localStorage.setItem(ROLE_KEY, receivedRole)
    localStorage.setItem(USERNAME_KEY, normalizedUsername)
    if (previousLogin) localStorage.setItem(PREVIOUS_LOGIN_KEY, previousLogin)
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
    setRole(receivedRole)
    setUsername(normalizedUsername)
    setLastLoginAt(previousLogin)
    return { mustChangePassword: false, role: receivedRole }
  }, [])

  const changeTemporaryPassword = useCallback(async ({ username, temporaryPassword, newPassword }) => {
    const response = await apiPost('/auth/first-login-password', { username, temporaryPassword, newPassword })
    const { token, role: receivedRole } = response || {}
    if (!token || !isKnownRole(receivedRole)) {
      throw new Error('Réponse de changement de mot de passe inattendue du serveur.')
    }

    const normalizedUsername = username.trim()
    clearAuthToken()
    const previousLogin = localStorage.getItem(LAST_LOGIN_KEY)
    setAuthToken(token)
    localStorage.setItem(ROLE_KEY, receivedRole)
    localStorage.setItem(USERNAME_KEY, normalizedUsername)
    if (previousLogin) localStorage.setItem(PREVIOUS_LOGIN_KEY, previousLogin)
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
    setRole(receivedRole)
    setUsername(normalizedUsername)
    setLastLoginAt(previousLogin)
    return receivedRole
  }, [])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  return <AuthContext.Provider value={{ role, username, lastLoginAt, login, changeTemporaryPassword, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
