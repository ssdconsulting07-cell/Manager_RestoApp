import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Dashboard from '../dashboard/Dashboard.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { STATUTS_COMMANDE, commandesDuJour, commandesEncaissees, countByStatutCommande } from './commandesData.js'
import {
  caDeLaSemaine, caDuJour, caDuMois, caPourDate, caSeptDerniersJours, debutDeMois, debutDeSemaine,
} from './financeData.js'
import { journalAudit } from './auditData.js'

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

// Le Layout (en-tete, notifications) n'est pas l'objet de ces tests.
vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

function sumDays(from, to) {
  let total = 0
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) total += caPourDate(d, to)
  return total
}

describe('Manager mock data', () => {
  const now = new Date(2026, 9, 8, 14, 30)

  it('derives the daily revenue from paid, non-cancelled orders only', () => {
    const encaissees = commandesEncaissees(commandesDuJour)
    expect(encaissees.every((c) => c.statut !== STATUTS_COMMANDE.ANNULEE)).toBe(true)
    expect(caDuJour()).toBe(encaissees.reduce((total, c) => total + c.montant, 0))
    expect(caPourDate(now, now)).toBe(caDuJour())
  })

  it('counts every order exactly once by status', () => {
    const counts = countByStatutCommande(commandesDuJour)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(commandesDuJour.length)
  })

  it('computes week (from Monday) and month (from the 1st) totals including today', () => {
    expect(debutDeSemaine(now)).toEqual(new Date(2026, 9, 5))
    expect(debutDeMois(now)).toEqual(new Date(2026, 9, 1))
    expect(caDeLaSemaine(now)).toBe(sumDays(new Date(2026, 9, 5), now))
    expect(caDuMois(now)).toBe(sumDays(new Date(2026, 9, 1), now))
    expect(caDuMois(now)).toBeGreaterThanOrEqual(caDeLaSemaine(now))
  })

  it('returns the last 7 days ending today, stable across calls', () => {
    const days = caSeptDerniersJours(now)
    expect(days).toHaveLength(7)
    expect(days[6].estAujourdhui).toBe(true)
    expect(days[0].date).toEqual(new Date(2026, 9, 2))
    expect(caSeptDerniersJours(now)).toEqual(days)
  })

  it('keeps the audit log to business actions, newest first', () => {
    const times = journalAudit.map((e) => new Date(e.createdAt).getTime())
    expect([...times].sort((a, b) => b - a)).toEqual(times)
    expect(journalAudit.some((e) => /connect/i.test(e.action))).toBe(false)
    expect(new Set(journalAudit.map((e) => e.acteur.role))).toEqual(new Set(['CUISINE', 'GERANT', 'MANAGER', 'LIVREUR']))
  })
})

describe('Dashboard by role', () => {
  beforeAll(() => {
    // recharts (ResponsiveContainer) a besoin de ResizeObserver, absent de jsdom.
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  })

  afterEach(cleanup)

  function renderFor(role) {
    useAuth.mockReturnValue({ role })
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )
  }

  it('renders the Manager dashboard with its three sections for MANAGER', () => {
    renderFor('MANAGER')
    expect(screen.getByRole('heading', { name: 'Chiffre d’affaires' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Commandes du jour' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Actions du personnel' })).toBeInTheDocument()

    const commandes = screen.getByRole('region', { name: 'Commandes du jour' })
    expect(within(commandes).getAllByRole('link')).toHaveLength(6)
    // Le Manager n'a acces qu'a /dashboard et /statistiques.
    screen.getAllByRole('link').forEach((link) => expect(link).toHaveAttribute('href', '/statistiques'))
  })

  it.each(['CUISINE', 'LIVREUR'])('keeps the generic dashboard for %s', (role) => {
    renderFor(role)
    expect(screen.queryByRole('heading', { name: 'Chiffre d’affaires' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Votre prochaine action' })).toBeInTheDocument()
  })
})
