import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vente from './Vente.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { MenuDataProvider } from '../gerant/MenuDataContext.jsx'
import { AccompagnementsCondimentsProvider } from '../gerant/AccompagnementsCondimentsContext.jsx'
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

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderVente() {
  useAuth.mockReturnValue({ username: 'vendeur-test' })
  return render(
    <MemoryRouter>
      <MenuDataProvider>
        <AccompagnementsCondimentsProvider>
          <Vente />
        </AccompagnementsCondimentsProvider>
      </MenuDataProvider>
    </MemoryRouter>,
  )
}

// Le nom du produit n'apparait qu'une fois tant que la page Panier n'est pas
// ouverte : la carte du catalogue est la seule occurrence.
function cliquerProduit(nom) {
  fireEvent.click(screen.getAllByText(nom)[0])
}

function ouvrirPanier() {
  fireEvent.click(screen.getByRole('button', { name: /Ouvrir le panier/ }))
}

describe('Vente (caisse Vendeur)', () => {
  it('désactive le bouton Panier tant que le panier est vide, et l’active après ajout', () => {
    renderVente()

    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toBeDisabled()

    cliquerProduit('Ketchup Burger Classique')

    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toHaveTextContent('1')
  })

  it('ouvre une page complète (pas un modal) avec nom, prix unitaire, image et bouton Accompagnement pour un produit éligible', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()

    // Page plein ecran : pas de role="dialog" qui englobe tout le flux.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Panier' })).toBeInTheDocument()
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()
    expect(screen.getByText(`${formatFCFA(3500)} / unité`)).toBeInTheDocument()
    expect(document.querySelector('.vendeur-panier-ligne-photo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter un accompagnement' })).toBeInTheDocument()
  })

  it('n’affiche pas de bouton Accompagnement pour un produit non éligible (une boisson)', () => {
    renderVente()

    fireEvent.click(screen.getByRole('tab', { name: /Boisson/ }))
    cliquerProduit('Jus de bissap')
    ouvrirPanier()

    expect(screen.getByText('Jus de bissap')).toBeInTheDocument()
    expect(screen.queryByText(/accompagnement/i)).not.toBeInTheDocument()
  })

  it('permet de choisir un accompagnement via le sous-modal, qui se referme et met à jour le total de la ligne', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un accompagnement' }))

    const sousModal = screen.getByRole('dialog')
    expect(within(sousModal).getByText(/Ketchup Burger Classique/)).toBeInTheDocument()
    fireEvent.click(within(sousModal).getByRole('button', { name: /Frites maison/ }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Accompagnement : Frites maison/ })).toBeInTheDocument()
    // 3500 (burger) + 1500 (frites) = 5000.
    expect(screen.getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)
  })

  it('permet à deux unités du même produit d’avoir des accompagnements différents (détache une ligne par unité personnalisée)', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()

    // Une seule ligne, 2 unités, aucun accompagnement choisi encore.
    expect(screen.getByRole('button', { name: 'Ajouter un accompagnement' })).toBeInTheDocument()
    expect(screen.getAllByText('Ketchup Burger Classique')).toHaveLength(1)

    // Donner un accompagnement à CETTE ligne ne peut s'appliquer qu'à une
    // unité à la fois : elle se détache dans sa propre ligne, l'autre unité
    // reste sans accompagnement — les deux burgers gardent des choix
    // indépendants plutôt qu'un changement groupé silencieux.
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un accompagnement' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Frites maison/ }))

    expect(screen.getByRole('button', { name: /Accompagnement : Frites maison/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter un accompagnement' })).toBeInTheDocument()
    expect(screen.getAllByText('Ketchup Burger Classique')).toHaveLength(2)

    // Le badge doit se distinguer visuellement entre les deux lignes du même
    // produit : rempli pour celle qui a un accompagnement, pointillé pour
    // l'autre — pas juste le texte, sinon les deux se ressemblent trop au
    // premier coup d'œil (retour utilisateur sur une capture d'écran).
    expect(screen.getByRole('button', { name: /Accompagnement : Frites maison/ })).toHaveClass('is-selected')
    expect(screen.getByRole('button', { name: 'Ajouter un accompagnement' })).not.toHaveClass('is-selected')

    // 2 burgers (3500 chacun) + 1 frites (1500) = 8500.
    expect(screen.getAllByText(formatFCFA(8500)).length).toBeGreaterThan(0)
  })

  it('« Retour au catalogue » revient au catalogue en conservant le panier (badge inchangé)', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: /Retour au catalogue/ }))

    expect(screen.getByRole('heading', { name: 'Nouvelle vente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toHaveTextContent('1')
  })

  it('« Annuler » affiche une confirmation si le panier n’est pas vide, et ne le vide qu’après confirmation', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    const confirmation = screen.getByRole('dialog')
    expect(within(confirmation).getByText('Annuler la vente ?')).toBeInTheDocument()

    fireEvent.click(within(confirmation).getByRole('button', { name: 'Non, revenir' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    fireEvent.click(screen.getByRole('button', { name: 'Oui, annuler' }))

    expect(screen.getByRole('heading', { name: 'Nouvelle vente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir le panier/ })).toBeDisabled()
  })

  it('« Annuler » ne demande pas de confirmation si le panier est déjà vide', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: /Retirer Ketchup Burger Classique du panier/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nouvelle vente' })).toBeInTheDocument()
  })

  it('étape Paiement en espèces : affiche Montant reçu / Monnaie à rendre, et désactive la confirmation si insuffisant', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Espèces' }))

    expect(screen.getByLabelText(/Montant reçu/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '1000' } })

    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '5000' } })
    // toHaveValue lit la valeur brute de l'input, sans normaliser les espaces :
    // on compare donc au format reel (espace fine insecable comprise).
    expect(screen.getByLabelText(/Monnaie à rendre/)).toHaveValue(rawFormatFCFA(1500))
    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).not.toBeDisabled()
  })

  it('étape Paiement : un autre mode (Wave) n’affiche pas les champs espèces et confirme directement', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Wave' }))

    expect(screen.queryByLabelText(/Montant reçu/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).not.toBeDisabled()
  })

  it('encaisse la vente, affiche le reçu détaillé (mode de paiement), et n’imprime le ticket que sur clic manuel, dans un nouvel onglet', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un accompagnement' }))
    fireEvent.click(screen.getByRole('button', { name: /Frites maison/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Espèces' }))
    fireEvent.change(screen.getByLabelText(/Montant reçu/), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }))

    expect(screen.getAllByText(/Ticket n°/).length).toBeGreaterThan(0)
    // 3500 (burger) + 1500 (frites) = 5000, le total de la vente.
    expect(screen.getAllByText(formatFCFA(5000)).length).toBeGreaterThan(0)
    expect(screen.getByText('Espèces')).toBeInTheDocument()
    expect(screen.getByText(formatFCFA(0))).toBeInTheDocument()
    expect(screen.getByText(/Vente encaissée/)).toBeInTheDocument()

    // Impression manuelle uniquement, dans un onglet dedie : jsdom n'implemente
    // pas window.open, on simule donc la fenetre qu'il renverrait.
    const fenetre = { document: { write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn() }
    const ouvrir = vi.spyOn(window, 'open').mockReturnValue(fenetre)
    expect(ouvrir).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Imprimer' }))

    expect(ouvrir).toHaveBeenCalledTimes(1)
    expect(fenetre.document.write).toHaveBeenCalledTimes(1)
    expect(fenetre.document.write.mock.calls[0][0]).toContain('Ticket n°')
    expect(fenetre.print).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle vente' }))
    expect(screen.getByText('Ketchup Burger Classique')).toBeInTheDocument()
  })

  it('n’affiche pas les lignes Montant reçu / Monnaie rendue sur le reçu pour un paiement non-espèces', () => {
    renderVente()

    cliquerProduit('Ketchup Burger Classique')
    ouvrirPanier()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Orange Money' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }))

    expect(screen.getByText('Orange Money')).toBeInTheDocument()
    expect(screen.queryByText('Montant reçu (espèces)')).not.toBeInTheDocument()
    expect(screen.queryByText('Monnaie rendue')).not.toBeInTheDocument()
  })
})
