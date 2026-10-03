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
    const { token, role: receivedRole } = await apiPost('/auth/login', { username, password })
    if (!token || !isKnownRole(receivedRole)) {
      throw new Error('Réponse de connexion inattendue du serveur.')
    }
    setAuthToken(token)
    const previousLogin = localStorage.getItem(LAST_LOGIN_KEY)
    localStorage.setItem(ROLE_KEY, receivedRole)
    localStorage.setItem(USERNAME_KEY, username.trim())
    if (previousLogin) localStorage.setItem(PREVIOUS_LOGIN_KEY, previousLogin)
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
    setRole(receivedRole)
    setUsername(username.trim())
    setLastLoginAt(previousLogin)
    return receivedRole
  }, [])

  // Acces local sans backend (UI Cuisine + donnees fictives).
  const loginDemoCuisine = useCallback(() => {
    clearAuthToken()
    setAuthToken('demo-cuisine-token')
    const previousLogin = localStorage.getItem(LAST_LOGIN_KEY)
    localStorage.setItem(ROLE_KEY, 'CUISINE')
    localStorage.setItem(USERNAME_KEY, 'cuisine-demo')
    if (previousLogin) localStorage.setItem(PREVIOUS_LOGIN_KEY, previousLogin)
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
    setRole('CUISINE')
    setUsername('cuisine-demo')
    setLastLoginAt(previousLogin)
    return 'CUISINE'
  }, [])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  return (
    <AuthContext.Provider value={{ role, username, lastLoginAt, login, loginDemoCuisine, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
