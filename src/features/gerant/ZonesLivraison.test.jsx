import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ZonesLivraison from './ZonesLivraison.jsx'
import { ARRONDISSEMENTS_PAR_REGION, REGIONS } from './senegalZones.js'
import { reinitialiserPourTests, zonesLivraison } from './zonesLivraisonData.js'

// Page "Zones de livraison" (Gerant, 24/10/2026) : carte des 14 regions,
// activables une a la fois, puis prix de livraison par arrondissement une
// fois une region "cadree". Entierement mockee (zonesLivraisonData.js) -
// voir brainstorming-chez-ketchup.md pour le cadrage complet.

vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

beforeEach(() => {
  reinitialiserPourTests()
})

afterEach(() => {
  cleanup()
})

describe('Zones de livraison', () => {
  it('affiche les 14 régions, Dakar déjà active avec ses arrondissements', () => {
    render(<ZonesLivraison />)

    expect(REGIONS).toHaveLength(14)
    for (const region of REGIONS) {
      expect(screen.getByRole('button', { name: region.nom })).toBeInTheDocument()
    }

    expect(screen.getByRole('button', { name: 'Dakar' })).toHaveClass('is-active')
    expect(screen.getByRole('button', { name: 'Thiès' })).not.toHaveClass('is-active')

    const sectionActives = screen.getByRole('heading', { name: 'Zones actives' }).closest('section')
    expect(within(sectionActives).getByText('Dakar')).toBeInTheDocument()
    expect(within(sectionActives).getByText(/11 arrondissements/)).toBeInTheDocument()
  })

  it('active une nouvelle région après confirmation, avec un prix par défaut sur chaque arrondissement', () => {
    render(<ZonesLivraison />)

    fireEvent.click(screen.getByRole('button', { name: 'Thiès' }))
    expect(screen.getByText(/Activer cette zone de livraison/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))

    expect(screen.getByRole('heading', { name: /Thiès — prix par arrondissement/ })).toBeInTheDocument()
    for (const arrondissement of ARRONDISSEMENTS_PAR_REGION.THIES) {
      expect(screen.getByLabelText(`Prix de livraison pour ${arrondissement.nom}`)).toHaveValue(1000)
    }
    expect(zonesLivraison.THIES).toBeDefined()
  })

  it('modifie le prix d’un arrondissement de la région ouverte', () => {
    render(<ZonesLivraison />)

    fireEvent.click(screen.getByRole('button', { name: 'Dakar' }))
    const champPrix = screen.getByLabelText('Prix de livraison pour Rufisque')
    expect(champPrix).toHaveValue(2500)

    fireEvent.change(champPrix, { target: { value: '3500' } })
    expect(champPrix).toHaveValue(3500)
    expect(zonesLivraison.DAKAR.Rufisque).toBe(3500)
  })

  it('désactive une région après confirmation et revient à la vue d’ensemble', () => {
    render(<ZonesLivraison />)

    fireEvent.click(screen.getByRole('button', { name: 'Dakar' }))
    fireEvent.click(screen.getByRole('button', { name: /Désactiver cette région/ }))
    expect(screen.getByText(/Désactiver cette zone de livraison/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver' }))

    expect(screen.getByRole('button', { name: 'Dakar' })).not.toHaveClass('is-active')
    expect(zonesLivraison.DAKAR).toBeUndefined()
    expect(screen.getByText(/Aucune zone de livraison active/)).toBeInTheDocument()
  })
})
