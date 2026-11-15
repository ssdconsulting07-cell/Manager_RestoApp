import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CommandeRow from './CommandeRow.jsx'
import { allowedTransitions } from '../../auth/transitions.js'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Commande App + Livraison en statut Prete : la seule transition CUISINE
// possible est PRETE -> EN_LIVRAISON, qui n'a aucun retour possible — d'ou
// la confirmation obligatoire testee ici.
const commandePreteLivraison = {
  id: 'c-2001',
  statut: 'PRETE',
  canal: 'APP',
  mode: 'LIVRAISON',
  creeLe: new Date().toISOString(),
  lignes: [{ produitId: 'p-burger', quantite: 1 }],
}

function renderRow() {
  const onTransition = vi.fn()
  render(
    <CommandeRow
      commande={commandePreteLivraison}
      produits={{}}
      transitions={allowedTransitions(commandePreteLivraison, 'CUISINE')}
      pending={false}
      onTransition={onTransition}
      showDuree
    />,
  )
  return { onTransition }
}

describe('CommandeRow — envoi au livreur', () => {
  it('ouvre la confirmation sans appeler onTransition au clic sur « Envoyer au livreur »', () => {
    const { onTransition } = renderRow()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer au livreur' }))

    const dialog = screen.getByRole('dialog', { name: 'Envoyer cette commande au livreur ?' })
    expect(within(dialog).getByText(/#c-2001/)).toBeInTheDocument()
    expect(onTransition).not.toHaveBeenCalled()
  })

  it('« Annuler » ferme la modale sans jamais appeler onTransition', () => {
    const { onTransition } = renderRow()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer au livreur' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onTransition).not.toHaveBeenCalled()
  })

  it('seul « Envoyer et imprimer » dans la modale déclenche onTransition(EN_LIVRAISON)', () => {
    const { onTransition } = renderRow()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer au livreur' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Envoyer et imprimer' }))

    expect(onTransition).toHaveBeenCalledTimes(1)
    expect(onTransition).toHaveBeenCalledWith('EN_LIVRAISON')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('imprime le ticket (onEnvoiLivreur) au moment de l’envoi, puis change le statut', () => {
    const onTransition = vi.fn()
    const onEnvoiLivreur = vi.fn()
    render(
      <CommandeRow
        commande={commandePreteLivraison}
        produits={{}}
        transitions={allowedTransitions(commandePreteLivraison, 'CUISINE')}
        pending={false}
        onTransition={onTransition}
        onEnvoiLivreur={onEnvoiLivreur}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer au livreur' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Envoyer et imprimer' }))

    expect(onEnvoiLivreur).toHaveBeenCalledWith(commandePreteLivraison)
    expect(onTransition).toHaveBeenCalledWith('EN_LIVRAISON')
  })
})

describe('CommandeRow — prise en charge par un livreur', () => {
  const partie = { ...commandePreteLivraison, id: 'c-2002', statut: 'EN_LIVRAISON' }

  it('« Je la prends » remplace les actions tant qu’aucun livreur ne l’a prise', () => {
    const onPrendre = vi.fn()
    render(
      <CommandeRow commande={partie} produits={{}} transitions={allowedTransitions(partie, 'LIVREUR')}
        pending={false} onTransition={vi.fn()} aPrendre onPrendre={onPrendre} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Je la prends/ }))
    expect(onPrendre).toHaveBeenCalledWith(partie)
    expect(screen.queryByRole('button', { name: /Livrée/ })).not.toBeInTheDocument()
  })
})
