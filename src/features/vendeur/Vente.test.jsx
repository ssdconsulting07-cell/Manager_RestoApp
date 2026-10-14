import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vente from './Vente.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { MenuDataProvider } from '../gerant/MenuDataContext.jsx'
import { formatFCFA as rawFormatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Testing Library normalise les espaces du DOM (y compris l'espace fine
// insecable   utilisee par toLocaleString('fr-FR') pour grouper les
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

function choisirAccompagnement(nomLigne, nomOption) {
  const select = screen.getByLabelText(`Accompagnement pour ${nomLigne}`)
  const option = within(select).getByRole('option', { name: new RegExp(nomOption) })
  fireEvent.change(select, { target: { value: option.value } })
}

describe('Vente (caisse Vendeur)', () => {
  it('ajoute un produit au panier, calcule le total et propose l’étape Accompagnements (produit éligible)', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    cliquerProduit('Ketchup Burger Classique')

    expect(within(screen.getByLabelText('Panier en cours')).getByText('2')).toBeInTheDocument()
    // La ligne du panier et le total partagent le meme montant (7000, un seul
    // produit) : getAllByText plutot que getByText, qui echouerait sur deux
    // correspondances.
    expect(screen.getAllByText(formatFCFA(7000)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Continuer vers les accompagnements' })).not.toBeDisabled()
  })

  it('saute l’étape Accompagnements pour un produit non éligible (ex. une boisson)', () => {
    renderVente()

    fireEvent.click(screen.getByRole('tab', { name: /Boisson/ }))
    cliquerProduit('Jus de bissap')

    const suivant = screen.getByRole('button', { name: 'Continuer vers le paiement' })
    expect(suivant).not.toBeDisabled()
    fireEvent.click(suivant)

    expect(screen.getByRole('heading', { name: 'Paiement en espèces' })).toBeInTheDocument()
  })

  it('permet de choisir un accompagnement, dont le prix s’ajoute au total', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers les accompagnements' }))

    expect(screen.getByRole('heading', { name: 'Choisissez un accompagnement' })).toBeInTheDocument()
    choisirAccompagnement('Ketchup Burger Classique', 'Frites maison')

    // 3500 (burger) + 1500 (frites) = 5000.
    expect(screen.getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)
    expect(screen.getByText('+ Frites maison')).toBeInTheDocument()
  })

  it('refuse de confirmer le paiement si le montant reçu est insuffisant', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers les accompagnements' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }))
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '1000' } })

    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).toBeDisabled()
  })

  it('permet de revenir en arrière avec « Retour »', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers les accompagnements' }))
    expect(screen.getByRole('heading', { name: 'Choisissez un accompagnement' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Retour/ }))
    expect(screen.getAllByText('Ketchup Burger Classique').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: /Plats/ })).toBeInTheDocument()
  })

  it('encaisse un paiement en espèces et affiche le reçu avec la monnaie rendue et l’accompagnement choisi', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers les accompagnements' }))
    choisirAccompagnement('Ketchup Burger Classique', 'Frites maison')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }))
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }))

    // Le recu affiche son propre "Ticket n°" et le toast de confirmation en
    // reprend un second (« Vente encaissée — Ticket n° X. ») : getAllByText
    // plutot que getByText, qui echouerait sur plusieurs correspondances.
    expect(screen.getAllByText(/Ticket n°/).length).toBeGreaterThan(0)
    // 3500 (burger) + 1500 (frites) = 5000, le total de la vente.
    expect(screen.getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)
    expect(screen.getByText('+ Frites maison')).toBeInTheDocument()
    expect(screen.getByText(formatFCFA(0))).toBeInTheDocument()
    expect(screen.getByText(/Vente encaissée/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle vente' }))
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()
  })
})
