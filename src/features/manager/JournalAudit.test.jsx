import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JournalAudit from './JournalAudit.jsx'
import { journalAudit } from './auditData.js'
import { exporterJournalAudit } from './exportJournalAudit.js'
import {
  TOUS, erreurPeriode, filtrerJournal, filtrerParPeriode, libellePeriode, lignesExport, nomFichierExport,
} from './journalAuditFiltres.js'

vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('./exportJournalAudit.js', () => ({
  exporterJournalAudit: vi.fn().mockResolvedValue(undefined),
}))

const entree = (id, role, domaine, nom, action, iso) => ({ id, acteur: { nom, role }, domaine, action, createdAt: iso })
const ENTREES = [
  entree('1', 'GERANT', 'PRODUIT', 'Awa Ndiaye', 'a publié le produit « Thiebou Dieune »', new Date(2026, 9, 8, 14, 0).toISOString()),
  entree('2', 'CUISINE', 'COMMANDE', 'Moussa Diop', 'a marqué la commande #479 comme prête', new Date(2026, 9, 6, 23, 59).toISOString()),
  entree('3', 'MANAGER', 'COMMANDE', 'Fatou Sarr', 'a annulé la commande #471', new Date(2026, 9, 3, 0, 0).toISOString()),
  entree('4', 'GERANT', 'PERSONNEL', 'Ousmane Kane', 'a créé le compte cuisine d’Aminata Ba', new Date(2026, 9, 2, 23, 59).toISOString()),
]

describe('Journal d’audit filters', () => {
  it('filters by role, action type and accent-insensitive search on name or action', () => {
    expect(filtrerJournal(ENTREES, { role: 'GERANT' }).map((e) => e.id)).toEqual(['1', '4'])
    expect(filtrerJournal(ENTREES, { domaine: 'COMMANDE' }).map((e) => e.id)).toEqual(['2', '3'])
    expect(filtrerJournal(ENTREES, { recherche: 'prete' }).map((e) => e.id)).toEqual(['2'])
    expect(filtrerJournal(ENTREES, { recherche: 'FATOU annulé' }).map((e) => e.id)).toEqual(['3'])
    expect(filtrerJournal(ENTREES, { role: 'GERANT', domaine: 'COMMANDE' })).toEqual([])
    expect(filtrerJournal(ENTREES, { role: TOUS, domaine: TOUS, recherche: '  ' })).toHaveLength(4)
  })

  it('bounds the period inclusively, each date being optional', () => {
    expect(filtrerParPeriode(ENTREES, { debut: '2026-10-03', fin: '2026-10-06' }).map((e) => e.id)).toEqual(['2', '3'])
    expect(filtrerParPeriode(ENTREES, { debut: '2026-10-06', fin: '' }).map((e) => e.id)).toEqual(['1', '2'])
    expect(filtrerParPeriode(ENTREES, { debut: '', fin: '2026-10-02' }).map((e) => e.id)).toEqual(['4'])
    expect(filtrerParPeriode(ENTREES, { debut: '', fin: '' })).toHaveLength(4)
  })

  it('rejects an end date before the start date', () => {
    expect(erreurPeriode({ debut: '2026-10-06', fin: '2026-10-03' })).toMatch(/fin/)
    expect(erreurPeriode({ debut: '2026-10-06', fin: '2026-10-06' })).toBeNull()
    expect(erreurPeriode({ debut: '', fin: '2026-10-03' })).toBeNull()
  })

  it('names the file and labels the period from the chosen dates', () => {
    const now = new Date(2026, 9, 8)
    expect(nomFichierExport({ debut: '2026-10-01', fin: '2026-10-08' }, now)).toBe('journal-audit_2026-10-01_au_2026-10-08.xlsx')
    expect(nomFichierExport({ debut: '', fin: '' }, now)).toBe('journal-audit_complet_2026-10-08.xlsx')
    expect(libellePeriode({ debut: '2026-10-01', fin: '' })).toBe('Depuis le 01/10/2026')
  })

  it('maps entries to the five export columns', () => {
    expect(lignesExport([ENTREES[3]])[0]).toEqual({
      date: new Date(2026, 9, 2, 23, 59),
      employe: 'Ousmane Kane',
      role: 'Gérant',
      type: 'Personnel',
      description: 'a créé le compte cuisine d’Aminata Ba',
    })
  })
})

// Depuis le 23/10/2026 (retour utilisateur : page trop chargee), le Journal
// d'audit est une sous-page par role (/journal-audit/:roleSlug, voir
// App.jsx) plutot qu'un unique select « Tous les roles » — ces tests
// rendent donc la page a l'interieur d'une vraie Route parametree, comme en
// production (voir App.jsx), pour exercer le meme code de resolution de
// role (roleDepuisSlug) et la meme redirection sur slug invalide.
describe('Journal d’audit page', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  function renderPage(roleSlug = 'cuisine') {
    return render(
      <MemoryRouter initialEntries={[`/journal-audit/${roleSlug}`]}>
        <Routes>
          <Route path="/journal-audit/:roleSlug" element={<JournalAudit />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('lists one role’s log, paginated, read-only', () => {
    renderPage('cuisine')
    const cuisine = journalAudit.filter((e) => e.acteur.role === 'CUISINE')
    expect(screen.getByText(`1–10 sur ${cuisine.length}`)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(10)
    // Consultation seule : aucun bouton d'action sur les lignes.
    screen.getAllByRole('listitem').forEach((li) => expect(within(li).queryByRole('button')).not.toBeInTheDocument())
  })

  it('redirects an unknown role slug to the Cuisine sub-page', () => {
    renderPage('does-not-exist')
    const cuisine = journalAudit.filter((e) => e.acteur.role === 'CUISINE')
    expect(screen.getByText(`1–10 sur ${cuisine.length}`)).toBeInTheDocument()
  })

  it('renders a pill for each role, marking the current one active', () => {
    renderPage('livreur')
    ;['Cuisine', 'Gérant', 'Livreur', 'Vendeur'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'Livreur' })).toHaveClass('is-active')
  })

  it('switches role through the pills, resetting the domain filter and page', () => {
    renderPage('cuisine')
    const cuisine = journalAudit.filter((e) => e.acteur.role === 'CUISINE')
    const gerant = journalAudit.filter((e) => e.acteur.role === 'GERANT')
    expect(screen.getByText(`1–10 sur ${cuisine.length}`)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Gérant' }))
    expect(screen.getByText(`1–10 sur ${gerant.length}`)).toBeInTheDocument()
  })

  it('filters by domain through the stat cards, and offers a reset when nothing matches', () => {
    renderPage('cuisine')
    // Aucune action Personnel cote Cuisine (reservees au Gerant, voir
    // auditData.js) : la carte tombe donc a 0 et vide la liste.
    fireEvent.click(screen.getByRole('tab', { name: /Personnel/ }))
    expect(screen.getByText('Aucune action ne correspond à ces filtres.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))
    const cuisine = journalAudit.filter((e) => e.acteur.role === 'CUISINE')
    expect(screen.getByText(`1–10 sur ${cuisine.length}`)).toBeInTheDocument()
  })

  it('exports exactly the role’s entries within the period, and blocks an inverted period', async () => {
    renderPage('gerant')
    const gerants = journalAudit.filter((e) => e.acteur.role === 'GERANT')
    fireEvent.click(screen.getByRole('button', { name: /Exporter/ }))
    const dialog = screen.getByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText('Début'), { target: { value: '2026-10-06' } })
    fireEvent.change(within(dialog).getByLabelText('Fin'), { target: { value: '2026-10-03' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('La date de fin doit être postérieure')
    expect(within(dialog).getByRole('button', { name: /Exporter/ })).toBeDisabled()

    fireEvent.change(within(dialog).getByLabelText('Début'), { target: { value: '' } })
    fireEvent.change(within(dialog).getByLabelText('Fin'), { target: { value: '' } })
    expect(within(dialog).getByText(`${gerants.length} actions à exporter`)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Exporter/ }))

    await waitFor(() => expect(exporterJournalAudit).toHaveBeenCalledTimes(1))
    const { entrees, parametres } = exporterJournalAudit.mock.calls[0][0]
    expect(entrees.map((e) => e.id)).toEqual(gerants.map((e) => e.id))
    expect(parametres).toMatchObject({ role: 'Gérant', domaine: 'Tous les types', periode: 'Toute la période' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
