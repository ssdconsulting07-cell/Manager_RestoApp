import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Connexion from './Connexion.jsx'
import { useAuth } from './AuthContext.jsx'

vi.mock('./AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ state: {} }),
    useNavigate: () => vi.fn(),
  }
})

describe('Connexion', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  beforeEach(() => {
    useAuth.mockReturnValue({
      role: null,
      login: vi.fn().mockRejectedValue({ status: 401, message: 'Identifiants invalides' }),
      changeTemporaryPassword: vi.fn(),
    })
  })

  it.each([
    [4, 'Bonsoir.'],
    [5, 'Bonjour.'],
    [9, 'Bonjour.'],
    [12, 'Bon après-midi.'],
    [14, 'Bon après-midi.'],
    [17, 'Bon après-midi.'],
    [18, 'Bonsoir.'],
    [20, 'Bonsoir.'],
  ])('shows the greeting for local hour %i', (hour, greeting) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 30, hour, 0))

    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(greeting)
  })

  it('shows a clear error when login fails', async () => {
    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Identifiant/i), {
      target: { value: 'gestionnaire' },
    })

    const passwordInput = document.querySelector('input[autocomplete="current-password"]')
    fireEvent.change(passwordInput, {
      target: { value: 'mauvaismdp' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Échec de connexion\. Vérifiez votre identifiant et votre mot de passe\.*/i
      )
    })
  })

  it('requires a new password after a temporary-password login', async () => {
    const login = vi.fn().mockResolvedValue({ mustChangePassword: true, role: 'GERANT' })
    const changeTemporaryPassword = vi.fn().mockResolvedValue('GERANT')
    useAuth.mockReturnValue({ role: null, login, changeTemporaryPassword })

    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^Identifiant$/i), { target: { value: 'gerant' } })
    fireEvent.change(document.querySelector('input[autocomplete="current-password"]'), { target: { value: 'temp-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Définissez votre mot de passe.' })).toBeInTheDocument())
    const newPasswordInputs = document.querySelectorAll('input[autocomplete="new-password"]')
    fireEvent.change(newPasswordInputs[0], { target: { value: 'nouveau-password-12' } })
    fireEvent.change(newPasswordInputs[1], { target: { value: 'nouveau-password-12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et accéder à mon espace' }))

    await waitFor(() => {
      expect(changeTemporaryPassword).toHaveBeenCalledWith({
        username: 'gerant',
        temporaryPassword: 'temp-password',
        newPassword: 'nouveau-password-12',
      })
    })
  })

  it('asks staff to contact the manager for a temporary password', () => {
    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mot de passe oublié ?' }))

    expect(screen.getByText(/Contactez votre gérant pour obtenir un mot de passe temporaire/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument()
  })
})
