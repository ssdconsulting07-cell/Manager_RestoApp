import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import VendeurDashboard from './VendeurDashboard.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatFCFA as rawFormatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { nombreArticles, totalEncaisseDuJourDe, ventesDe, ventesDuJourDe } from './ventesData.js'

// Testing Library normalise les espaces du DOM (y compris l'espace fine
// insecable \u202F utilisee par toLocaleString('fr-FR')) en espace classique
// avant de comparer : on applique la meme normalisation au texte attendu.
function formatFCFA(montant) {
  return rawFormatFCFA(montant).replace(/\s/g, ' ')
}

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

describe('VendeurDashboard', () => {
  beforeAll(() => {
    // recharts (ResponsiveContainer) a besoin de ResizeObserver, absent de jsdom.
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  })

  afterEach(cleanup)

  function renderPage() {
    useAuth.mockReturnValue({ username: 'vendeur' })
    return render(<MemoryRouter><VendeurDashboard /></MemoryRouter>)
  }

  it('shows the day’s KPIs computed from the seeded sales, same bricks as Gerant/Manager', () => {
    renderPage()
    const ventesDuJour = ventesDuJourDe('vendeur')
    const totalDuJour = totalEncaisseDuJourDe('vendeur')
    const dernierTicket = ventesDuJour[0]

    expect(screen.getByRole('heading', { name: 'Ventes du jour' })).toBeInTheDocument()
    expect(screen.getByText(String(ventesDuJour.length))).toBeInTheDocument()
    expect(screen.getAllByText(formatFCFA(totalDuJour)).length).toBeGreaterThan(0)
    expect(screen.getByText(`N° ${dernierTicket.numero}`)).toBeInTheDocument()
  })

  it('lists the vendeur’s recent tickets, most recent first', () => {
    renderPage()
    const tickets = ventesDe('vendeur')
    const feed = screen.getByRole('heading', { name: 'Derniers tickets' }).closest('section')
    const items = within(feed).getAllByRole('listitem')
    expect(items).toHaveLength(Math.min(8, tickets.length))
    expect(items[0]).toHaveTextContent(`Ticket n° ${tickets[0].numero}`)
    expect(items[0]).toHaveTextContent(`${nombreArticles(tickets[0])} article`)
  })
})
