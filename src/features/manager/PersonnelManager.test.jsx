import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PersonnelManager from './PersonnelManager.jsx'
import { apiGet } from '../../api/client.js'

// Page Personnel cote Manager (24/10/2026) : le Manager gere desormais les
// comptes Gerant (section CRUD) et consulte le reste de l'equipe (section
// lecture seule) - voir brainstorming-chez-ketchup.md.

vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ username: 'manager' }),
}))

vi.mock('../../api/client.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

const TOUS_LES_COMPTES = [
  { id: '1', firstName: 'Ousmane', lastName: 'Kane', username: 'gerant', role: 'GERANT', active: true, phone: '', cni: '' },
  { id: '2', firstName: 'Awa', lastName: 'Ndiaye', username: 'gerant2', role: 'GERANT', active: true, phone: '', cni: '' },
  { id: '3', firstName: 'Moussa', lastName: 'Diop', username: 'cuisine', role: 'CUISINE', active: true, phone: '', cni: '' },
  { id: '4', firstName: 'Ibra', lastName: 'Fall', username: 'livreur', role: 'LIVREUR', active: true, phone: '', cni: '' },
  { id: '5', firstName: 'Khadidiatou', lastName: 'Sow', username: 'vendeur', role: 'VENDEUR', active: true, phone: '', cni: '' },
]

describe('Page Personnel (Manager)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('la section Gérants gère les comptes Gérant en CRUD, sans les autres employés', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    const sectionGerants = await screen.findByRole('region', { name: 'Gérants' })
    expect(within(sectionGerants).getByText('Ousmane Kane')).toBeInTheDocument()
    expect(within(sectionGerants).getByText('Awa Ndiaye')).toBeInTheDocument()
    expect(within(sectionGerants).queryByText('Moussa Diop')).not.toBeInTheDocument()

    // CRUD complet disponible sur cette section.
    expect(within(sectionGerants).getByRole('button', { name: /Créer un compte Gérant/ })).toBeInTheDocument()
    expect(within(sectionGerants).getAllByRole('button', { name: /Modifier/ })).toHaveLength(2)
  })

  it('la section Équipe liste Cuisine/Livreur/Vendeur en lecture seule, sans les Gérants', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    const sectionEquipe = await screen.findByRole('region', { name: 'Équipe (lecture seule)' })
    expect(within(sectionEquipe).getByText('Moussa Diop')).toBeInTheDocument()
    expect(within(sectionEquipe).getByText('Ibra Fall')).toBeInTheDocument()
    expect(within(sectionEquipe).getByText('Khadidiatou Sow')).toBeInTheDocument()
    expect(within(sectionEquipe).queryByText('Ousmane Kane')).not.toBeInTheDocument()

    // Pas de bouton de creation ni de modification dans cette section.
    expect(within(sectionEquipe).queryByRole('button', { name: /Créer un compte/ })).not.toBeInTheDocument()
    expect(within(sectionEquipe).queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument()
    expect(within(sectionEquipe).queryByRole('button', { name: /Désactiver/ })).not.toBeInTheDocument()
    expect(within(sectionEquipe).getAllByRole('button', { name: /Détail/ })).toHaveLength(3)
  })

  it('force le rôle Gérant à la création, sans sélecteur de rôle', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    const sectionGerants = await screen.findByRole('region', { name: 'Gérants' })
    fireEvent.click(within(sectionGerants).getByRole('button', { name: /Créer un compte Gérant/ }))

    expect(screen.queryByLabelText('Rôle')).not.toBeInTheDocument()
    expect(screen.getByText('Gérant', { selector: 'strong' })).toBeInTheDocument()
  })
})
