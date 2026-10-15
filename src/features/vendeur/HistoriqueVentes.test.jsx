import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HistoriqueVentes from './HistoriqueVentes.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ventesDuJourDe } from './ventesData.js'
import { exporterVentes } from './exportVentes.js'

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

// Le Layout (sidebar, en-tete) n'est pas l'objet de ces tests.
vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('./exportVentes.js', () => ({
  exporterVentes: vi.fn().mockResolvedValue(undefined),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage() {
  useAuth.mockReturnValue({ username: 'vendeur' })
  return render(<MemoryRouter><HistoriqueVentes /></MemoryRouter>)
}

describe('Historique des ventes (Vendeur)', () => {
  it('lists today’s sales for the connected vendeur only', () => {
    renderPage()
    const ventes = ventesDuJourDe('vendeur')
    // Les 5 ventes seedees aujourd'hui pour ce compte tiennent sur la
    // premiere page (ROWS_OPTIONS[0] = 5).
    expect(screen.getAllByRole('listitem')).toHaveLength(ventes.length)
    expect(screen.getByText(`1–${ventes.length} sur ${ventes.length}`)).toBeInTheDocument()

    // Lien "Nouvelle vente" sans fleche (retour utilisateur) : le nom
    // accessible doit etre exactement ce texte, pas "Nouvelle vente →".
    expect(screen.getByRole('link', { name: 'Nouvelle vente' })).toBeInTheDocument()
  })

  it('filters by ticket number, offering a reset when nothing matches', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Rechercher une vente'), { target: { value: '102' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Ticket n° 102')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rechercher une vente'), { target: { value: 'aucune-correspondance' } })
    expect(screen.getByText('Aucune vente ne correspond à cette recherche.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser la recherche' }))
    expect(screen.queryByText('Aucune vente ne correspond à cette recherche.')).not.toBeInTheDocument()
  })

  it('exports exactly the filtered sales and confirms it with a toast', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Rechercher une vente'), { target: { value: '102' } })
    fireEvent.click(screen.getByRole('button', { name: /Exporter/ }))

    await waitFor(() => expect(exporterVentes).toHaveBeenCalledTimes(1))
    const { ventes } = exporterVentes.mock.calls[0][0]
    expect(ventes.map((v) => v.numero)).toEqual([102])
    expect(await screen.findByText(/vente exportée dans/)).toBeInTheDocument()
  })

  it('opens the receipt modal for a ticket, with a way to reprint it', () => {
    renderPage()
    fireEvent.click(screen.getByText('Ticket n° 101'))
    const dialog = screen.getByRole('dialog', { name: /Reçu du ticket n° 101/ })
    expect(dialog).toBeInTheDocument()
    // Reimprimer un ticket deja encaisse depuis l'historique (retour
    // utilisateur) : le bouton Imprimer n'est plus reserve a la vente
    // fraichement encaissee.
    expect(within(dialog).getByRole('button', { name: 'Imprimer' })).toBeInTheDocument()
  })
})
