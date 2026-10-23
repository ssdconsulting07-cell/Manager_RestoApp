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
    // MANAGER n'apparait plus ici depuis le 16/10/2026 (audit de coherence
    // des flux) : les annulations de commandes sont desormais reservees a
    // la Cuisine (voir transitions.js/auditData.js), et c'etait la seule
    // action que ce mock attribuait au Manager — qui ne fait par ailleurs
    // que consulter (dashboard/journal), jamais agir. VENDEUR ajoute le
    // 23/10/2026 (ventes comptoir, voir auditData.js/JournalAudit.jsx).
    expect(new Set(journalAudit.map((e) => e.acteur.role))).toEqual(new Set(['CUISINE', 'GERANT', 'LIVREUR', 'VENDEUR']))
  })

  it('reserves Personnel actions to Gerant staff and keeps the Manager on orders', () => {
    expect(journalAudit.length).toBeGreaterThanOrEqual(40)
    journalAudit.filter((e) => e.domaine === 'PERSONNEL').forEach((e) => expect(e.acteur.role).toBe('GERANT'))
    journalAudit.filter((e) => e.acteur.role === 'MANAGER').forEach((e) => expect(e.domaine).toBe('COMMANDE'))
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
    // Le Manager n'a acces qu'a /dashboard et /journal-audit (sous-page
    // Cuisine par defaut, voir ManagerDashboard.jsx).
    screen.getAllByRole('link').forEach((link) => expect(link).toHaveAttribute('href', '/journal-audit/cuisine'))

    // Le flux n'est qu'un apercu des 12 dernieres actions du Journal d'audit.
    const audit = screen.getByRole('region', { name: 'Actions du personnel' })
    expect(within(audit).getAllByRole('listitem')).toHaveLength(12)
    expect(within(audit).getAllByRole('listitem')[0]).toHaveTextContent(`${journalAudit[0].acteur.nom} ${journalAudit[0].action}`)
  })

  it('renders the Livreur dashboard on the same generic pattern as Cuisine/Gerant/Manager/Vendeur', () => {
    renderFor('LIVREUR')
    expect(screen.queryByRole('heading', { name: 'Chiffre d’affaires' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Votre prochaine action' })).not.toBeInTheDocument()
    // Meme dispatch que Cuisine/Gerant/Manager/Vendeur (voir dashboard/Dashboard.jsx) :
    // intro generique (titre + badge de role), pas son propre Layout/hero
    // (voir livreur/LivreurDashboard.jsx).
    expect(screen.getByRole('heading', { name: 'Bonjour, équipe Livraison.', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Livreur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prochaines livraisons' })).toBeInTheDocument()
  })

  it('renders the Cuisine dashboard on the same generic pattern as Gerant/Manager/Vendeur', () => {
    renderFor('CUISINE')
    expect(screen.queryByRole('heading', { name: 'Chiffre d’affaires' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Votre prochaine action' })).not.toBeInTheDocument()
    // Meme dispatch que Gerant/Manager/Vendeur (voir dashboard/Dashboard.jsx) :
    // intro generique (tableau de bord + badge de role), pas son propre
    // Layout/hero (voir cuisine/CuisineDashboard.jsx).
    expect(screen.getByRole('heading', { name: 'Tableau de bord', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Cuisine')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prochains tickets' })).toBeInTheDocument()
  })

  it('renders the Vendeur dashboard on the same generic pattern as Gerant/Manager', () => {
    renderFor('VENDEUR')
    expect(screen.queryByRole('heading', { name: 'Chiffre d’affaires' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Votre prochaine action' })).not.toBeInTheDocument()
    // Meme dispatch que Gerant/Manager (voir dashboard/Dashboard.jsx) : intro
    // generique (tableau de bord + badge de role), pas son propre Layout/hero.
    expect(screen.getByRole('heading', { name: 'Tableau de bord', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Vendeur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ventes du jour' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Derniers tickets' })).toBeInTheDocument()
  })
})
