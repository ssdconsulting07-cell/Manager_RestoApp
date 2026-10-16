import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { apiGet } from '../../api/client.js'
import { useCuisineBoard } from './useCuisineBoard.js'

// Pas besoin d'un vrai AuthProvider : seul le role compte ici (il n'influe
// pas sur la detection de nouvelle commande, testee ci-dessous).
vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ role: 'CUISINE' }),
}))

vi.mock('../../api/client.js', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

function commandePayee(id) {
  return { id, statut: 'PAYEE', mode: 'RETRAIT', creeLe: new Date().toISOString(), lignes: [] }
}

describe('useCuisineBoard', () => {
  it(
    'signale (bip + toast) la toute premiere vraie commande qui arrive juste après ' +
      'une cuisine vide — bug corrigé : comparer sur la liste déjà remplacée par la ' +
      'démo faisait rater ce cas précis, pourtant le plus utile pour l’alerte',
    async () => {
      // 1er chargement : l'API ne renvoie aucune commande active -> la cuisine
      // est vide, la démo prend le relais. Cette réponse vide est bien réelle
      // et devient la base de comparaison (idsPayeesConnus) — l'absence
      // d'alerte ici tient seulement au fait que c'est le 1er chargement
      // (idsPayeesConnus démarre à null), pas à un manque de donnée réelle.
      apiGet.mockImplementation(() => Promise.resolve([]))

      const { result, unmount } = renderHook(() => useCuisineBoard())

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.demo).toBe(true)
      expect(result.current.nouvelleAlerte).toBeNull()

      // 2e chargement : une vraie commande payée arrive.
      const nouvelleCommande = commandePayee('c-1059')
      apiGet.mockImplementation((chemin) =>
        Promise.resolve(chemin === '/commandes' ? [nouvelleCommande] : []),
      )

      await act(async () => {
        await result.current.charger()
      })

      expect(result.current.demo).toBe(false)
      expect(result.current.nouvelleAlerte?.commandes).toEqual([nouvelleCommande])
      expect(result.current.commandes.map((c) => c.id)).toContain('c-1059')

      unmount()
    },
  )
})
