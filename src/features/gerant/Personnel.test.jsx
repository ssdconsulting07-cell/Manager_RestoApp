import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Personnel from './Personnel.jsx'
import { apiGet } from '../../api/client.js'

// Le Gerant ne gere plus que Cuisine/Livreur/Vendeur (24/10/2026) : ni le
// Manager (deja exclu), ni les autres comptes Gerant (nouvelle exclusion,
// voir brainstorming-chez-ketchup.md) - c'est desormais le Manager qui gere
// les comptes Gerant (voir PersonnelManager.test.jsx).

vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ username: 'gerant' }),
}))

vi.mock('../../api/client.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

const TOUS_LES_COMPTES = [
  { id: '1', firstName: 'Moussa', lastName: 'Diop', username: 'cuisine', role: 'CUISINE', active: true, phone: '', cni: '' },
  { id: '2', firstName: 'Ibra', lastName: 'Fall', username: 'livreur', role: 'LIVREUR', active: true, phone: '', cni: '' },
  { id: '3', firstName: 'Khadidiatou', lastName: 'Sow', username: 'vendeur', role: 'VENDEUR', active: true, phone: '', cni: '' },
  { id: '4', firstName: 'Ousmane', lastName: 'Kane', username: 'gerant', role: 'GERANT', active: true, phone: '', cni: '' },
  { id: '5', firstName: 'Fatou', lastName: 'Sarr', username: 'manager', role: 'MANAGER', active: true, phone: '', cni: '' },
]

describe('Personnel page (Gérant)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('n’affiche ni le Manager ni les autres comptes Gérant, seulement Cuisine/Livreur/Vendeur', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<Personnel />)

    await waitFor(() => expect(screen.getByText('Moussa Diop')).toBeInTheDocument())
    expect(screen.getByText('Ibra Fall')).toBeInTheDocument()
    expect(screen.getByText('Khadidiatou Sow')).toBeInTheDocument()
    expect(screen.queryByText('Ousmane Kane')).not.toBeInTheDocument()
    expect(screen.queryByText('Fatou Sarr')).not.toBeInTheDocument()

    // Compteur « Tous » : seulement les 3 comptes geres par le Gerant.
    const tousOnglet = screen.getByRole('tab', { name: /Tous/ })
    expect(within(tousOnglet).getByText('3')).toBeInTheDocument()
  })

  it('ne propose que Cuisine/Livreur/Vendeur comme rôle assignable à la création', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<Personnel />)

    await waitFor(() => expect(screen.getByText('Moussa Diop')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Créer un compte/ }))

    const roleSelect = screen.getByLabelText('Rôle')
    const options = within(roleSelect).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Cuisine', 'Livreur', 'Vendeur'])
  })
})
