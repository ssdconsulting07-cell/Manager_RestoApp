// Client API vers le backend commun (Spring Boot).
// Base = /api/v1 (voir backend/contrat-api/openapi.yaml, source de verite du contrat)
// Contrairement a l'App Client, le staff est authentifie : une fois le token
// stocke via setAuthToken() (apres /auth/login), il est attache automatiquement
// a chaque appel.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const TOKEN_KEY = 'senyummies_manager_token'
// Emis quand l'API repond 401 alors qu'un token etait envoye (token expire ou revoque).
export const SESSION_EXPIRED_EVENT = 'senyummies:session-expired'

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res) {
  if (res.status === 401 && getAuthToken()) {
    clearAuthToken()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
  if (!res.ok) {
    // Format d'erreur standard (voir ApiError cote backend) : { code, message, field }
    const body = await res.json().catch(() => null)
    const error = new Error(body?.message || `Erreur API (${res.status})`)
    error.code = body?.code
    error.field = body?.field
    error.status = res.status
    throw error
  }
  return res.status === 204 ? null : res.json()
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...authHeaders() } })
  return handleResponse(res)
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}
