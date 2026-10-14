import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vente from './Vente.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { MenuDataProvider } from '../gerant/MenuDataContext.jsx'
import { formatFCFA as rawFormatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Testing Library normalise les espaces du DOM (y compris l'espace fine
// insecable   utilisee par toLocaleString('fr-FR') pour grouper les
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

// Le nom du produit n'apparait qu'une fois tant que le panier (modal) n'est
// pas ouvert : la carte du catalogue est la seule occurrence.
function cliquerProduit(nom) {
  fireEvent.click(screen.getAllByText(nom)[0])
}

function ouvrirPanier() {
  fireEvent.click(screen.getByRole('button', { name: /Ouvrir le panier/ }))
}

function modal() {
  return screen.getByRole('dialog')
}

function cliquerContinuer() {
  fireEvent.click(within(modal()).getByRole('button', { name: /Continuer/ }))
}

function choisirAccompagnement(nomLigne, nomOption) {
  const select = within(modal()).getByLabelText(`Accompagnement pour ${nomLigne}`)
  const option = within(select).getByRole('option', { name: new RegExp(nomOption) })
  fireEvent.change(select, { target: { value: option.value } })
}

describe('Vente (caisse Vendeur)', () => {
  it('désactive le bouton Panier tant que le panier est vide', () => {
    renderVente()

    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toBeDisabled()

    cliquerProduit('Ketchup Burger Classique')

    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).not.toBeDisabled()
  })

  it('ajoute un produit au panier (badge du bouton Panier) et affiche le total dans le modal', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    cliquerProduit('Ketchup Burger Classique')

    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toHaveTextContent('2')

    ouvrirPanier()

    // La ligne du panier et le total partagent le meme montant (7000, un seul
    // produit) : getAllByText plutot que getByText, qui echouerait sur deux
    // correspondances.
    expect(within(modal()).getAllByText(formatFCFA(7000)).length).toBeGreaterThan(0)
    expect(within(modal()).getByRole('button', { name: /Continuer/ })).not.toBeDisabled()
  })

  it('saute l’étape Accompagnements pour un produit non éligible (ex. une boisson)', () => {
    renderVente()

    fireEvent.click(screen.getByRole('tab', { name: /Boisson/ }))
    cliquerProduit('Jus de bissap')
    ouvrirPanier()
    cliquerContinuer()

    expect(within(modal()).getByRole('heading', { name: 'Paiement en espèces' })).toBeInTheDocument()
  })

  it('permet de choisir un accompagnement, dont le prix s’ajoute au total', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    cliquerContinuer()

    expect(within(modal()).getByRole('heading', { name: 'Choisissez un accompagnement' })).toBeInTheDocument()
    choisirAccompagnement('Ketchup Burger Classique', 'Frites maison')

    // 3500 (burger) + 1500 (frites) = 5000.
    expect(within(modal()).getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)

    // Revenir au panier affiche la ligne avec son accompagnement choisi.
    fireEvent.click(within(modal()).getByRole('button', { name: /Retour/ }))
    expect(within(modal()).getByText('+ Frites maison')).toBeInTheDocument()
  })

  it('refuse de confirmer le paiement si le montant reçu est insuffisant', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    cliquerContinuer()
    cliquerContinuer()
    fireEvent.change(within(modal()).getByLabelText(/Montant reçu/), { target: { value: '1000' } })

    expect(within(modal()).getByRole('button', { name: 'Confirmer le paiement' })).toBeDisabled()
  })

  it('permet de revenir en arrière avec « Retour », en conservant le panier', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    cliquerContinuer()
    expect(within(modal()).getByRole('heading', { name: 'Choisissez un accompagnement' })).toBeInTheDocument()

    fireEvent.click(within(modal()).getByRole('button', { name: /Retour/ }))
    expect(within(modal()).getByText('Ketchup Burger Classique')).toBeInTheDocument()
    expect(within(modal()).getByRole('button', { name: 'Vider' })).toBeInTheDocument()
  })

  it('ferme le modal sans perdre le panier (badge inchangé) puis le rouvre à l’étape Panier', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    cliquerContinuer()
    fireEvent.click(within(modal()).getByRole('button', { name: 'Fermer le panier' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toHaveTextContent('1')

    ouvrirPanier()
    expect(within(modal()).getByText('Ketchup Burger Classique')).toBeInTheDocument()
    expect(within(modal()).getByRole('button', { name: 'Vider' })).toBeInTheDocument()
  })

  it('encaisse un paiement en espèces et affiche le reçu avec la monnaie rendue et l’accompagnement choisi', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    cliquerContinuer()
    choisirAccompagnement('Ketchup Burger Classique', 'Frites maison')
    cliquerContinuer()
    fireEvent.change(within(modal()).getByLabelText(/Montant reçu/), { target: { value: '5000' } })
    fireEvent.click(within(modal()).getByRole('button', { name: 'Confirmer le paiement' }))

    // Le recu affiche son propre "Ticket n°" et le toast de confirmation en
    // reprend un second (« Vente encaissée — Ticket n° X. ») : getAllByText
    // plutot que getByText, qui echouerait sur plusieurs correspondances.
    expect(screen.getAllByText(/Ticket n°/).length).toBeGreaterThan(0)
    // 3500 (burger) + 1500 (frites) = 5000, le total de la vente.
    expect(screen.getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)
    expect(screen.getByText('+ Frites maison')).toBeInTheDocument()
    expect(screen.getByText(formatFCFA(0))).toBeInTheDocument()
    expect(screen.getByText(/Vente encaissée/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle vente' }))
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()
    // Panier vide : le bouton Panier n'affiche plus de badge numérique.
    const boutonPanier = screen.getByRole('button', { name: /Ouvrir le panier \(0 article\)/ })
    expect(within(boutonPanier).queryByText(/^\d+$/)).not.toBeInTheDocument()
  })
})
