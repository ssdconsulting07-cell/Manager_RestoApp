import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vente from './Vente.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { MenuDataProvider } from '../gerant/MenuDataContext.jsx'
import { formatFCFA as rawFormatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Testing Library normalise les espaces du DOM (y compris l'espace fine
// insecable \u202F utilisee par toLocaleString('fr-FR') pour grouper les
// milliers) en espace classique avant de comparer : on applique la meme
// normalisation au texte attendu, sinon getByText/getAllByText ne trouvent
// jamais de correspondance.
function formatFCFA(montant) {
  return rawFormatFCFA(montant).replace(/\s/g, ' ')
}

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

// Le Layout (sidebar, en-tete) n'est pas l'objet de ces tests.
vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

afterEach(cleanup)

function renderVente() {
  useAuth.mockReturnValue({ username: 'vendeur-test' })
  return render(
    <MemoryRouter>
      <MenuDataProvider>
        <Vente />
      </MenuDataProvider>
    </MemoryRouter>,
  )
}

// Le nom du produit apparait aussi dans le panier une fois ajoute (et dans
// l'aria-label du bouton de suppression) : on cible toujours la carte du
// catalogue, premiere occurrence dans l'ordre du document.
function cliquerProduit(nom) {
  fireEvent.click(screen.getAllByText(nom)[0])
}

describe('Vente (caisse Vendeur)', () => {
  it('ajoute un produit au panier et calcule le total', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    cliquerProduit('Ketchup Burger Classique')

    expect(screen.getByText('2')).toBeInTheDocument()
    // La ligne du panier et le total partagent le meme montant (7000, un seul
    // produit) : getAllByText plutot que getByText, qui echouerait sur deux
    // correspondances.
    expect(screen.getAllByText(formatFCFA(7000)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Encaisser/ })).not.toBeDisabled()
  })

  it('refuse de confirmer le paiement si le montant reçu est insuffisant', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: /Encaisser/ }))
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '1000' } })

    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).toBeDisabled()
  })

  it('encaisse un paiement en espèces et affiche le reçu avec la monnaie rendue', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: /Encaisser/ }))
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }))

    // Le recu affiche son propre "Ticket n°" et le toast de confirmation en
    // reprend un second (« Vente encaissée — Ticket n° X. ») : getAllByText
    // plutot que getByText, qui echouerait sur plusieurs correspondances.
    expect(screen.getAllByText(/Ticket n°/).length).toBeGreaterThan(0)
    // Le total de la vente et la ligne unique partagent le meme montant (3500) :
    // getAllByText plutot que getByText, qui echouerait sur plusieurs correspondances.
    expect(screen.getAllByText(formatFCFA(3500)).length).toBeGreaterThan(0)
    expect(screen.getByText(formatFCFA(5000))).toBeInTheDocument()
    expect(screen.getByText(formatFCFA(1500))).toBeInTheDocument()
    expect(screen.getByText(/Vente encaissée/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle vente' }))
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()
  })
})
