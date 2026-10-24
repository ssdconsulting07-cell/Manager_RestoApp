import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PersonnelManager from './PersonnelManager.jsx'
import { apiDelete, apiGet } from '../../api/client.js'

// Page Personnel cote Manager (24/10/2026) : le Manager gere desormais les
// comptes Gerant (groupe CRUD) et consulte le reste de l'equipe (groupe
// lecture seule) - bascule via deux cartes stats/filtre Gerants/Autres,
// un seul groupe affiche a la fois (retour utilisateur du 24/10/2026) -
// voir brainstorming-chez-ketchup.md.

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

  it('affiche par défaut le groupe Gérants (CRUD), sans les autres employés', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    const sectionGerants = await screen.findByRole('region', { name: 'Gérants' })
    expect(within(sectionGerants).getByText('Ousmane Kane')).toBeInTheDocument()
    expect(within(sectionGerants).getByText('Awa Ndiaye')).toBeInTheDocument()
    expect(within(sectionGerants).queryByText('Moussa Diop')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Équipe (lecture seule)' })).not.toBeInTheDocument()

    // CRUD complet disponible sur ce groupe.
    expect(within(sectionGerants).getByRole('button', { name: /Créer un compte Gérant/ })).toBeInTheDocument()
    expect(within(sectionGerants).getAllByRole('button', { name: /Modifier/ })).toHaveLength(2)

    // Les deux cartes stats/filtre du haut : Gérants et Autres, avec leurs effectifs.
    expect(screen.getByRole('tab', { name: /2.*Gérants/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /3.*Autres/ })).toBeInTheDocument()
  })

  it('bascule vers le groupe Autres : Cuisine/Livreur/Vendeur en lecture seule, sans les Gérants', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    await screen.findByRole('region', { name: 'Gérants' })
    fireEvent.click(screen.getByRole('tab', { name: /Autres/ }))

    const sectionEquipe = await screen.findByRole('region', { name: 'Équipe (lecture seule)' })
    expect(within(sectionEquipe).getByText('Moussa Diop')).toBeInTheDocument()
    expect(within(sectionEquipe).getByText('Ibra Fall')).toBeInTheDocument()
    expect(within(sectionEquipe).getByText('Khadidiatou Sow')).toBeInTheDocument()
    expect(within(sectionEquipe).queryByText('Ousmane Kane')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Gérants' })).not.toBeInTheDocument()

    // Pas de bouton de creation ni de modification dans ce groupe.
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

  it('le statut Actif/Désactivé du groupe Gérants est un badge cliquable, sans bouton Désactiver séparé', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<PersonnelManager />)

    const sectionGerants = await screen.findByRole('region', { name: 'Gérants' })
    expect(within(sectionGerants).queryByRole('button', { name: /^Désactiver$/ })).not.toBeInTheDocument()

    const badgeOusmane = within(sectionGerants).getAllByRole('button', { name: /Actif/ })[0]
    fireEvent.click(badgeOusmane)
    expect(screen.getByText(/Désactiver ce compte/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Désactiver' }))
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/staff-users/1'))
  })
})
