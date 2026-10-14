import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useMenuData } from '../gerant/MenuDataContext.jsx'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { enregistrerVente } from './ventesData.js'
import Recu from './Recu.jsx'
import './vendeur-pos.css'

// Espace Vendeur/Caissier (V2) : prise de commande au comptoir, encaissement
// especes, recu — dans l'esprit d'une caisse de type McDonald's/Starbucks.
// Catalogue mock reutilise de l'espace Gerant (memes produits, memes
// categories) : un seul menu dans l'app, pas de duplication.
export default function Vente() {
  const { username } = useAuth()
  const { categories, produits, categorieNomParId } = useMenuData()
  const [categorieActive, setCategorieActive] = useState('toutes')
  const [panier, setPanier] = useState([])
  const [paiementOuvert, setPaiementOuvert] = useState(false)
  const [montantRecu, setMontantRecu] = useState('')
  const [derniereVente, setDerniereVente] = useState(null)
  const [toast, setToast] = useState(null)

  const categoriesDisponibles = categories.filter((c) => c.statut === 'ACTIF')
  const produitsDisponibles = produits.filter((p) => p.statut === 'ACTIF' && p.disponibilite === 'EN_STOCK')
  const produitsAffiches = categorieActive === 'toutes'
    ? produitsDisponibles
    : produitsDisponibles.filter((p) => p.categorieId === categorieActive)

  const total = useMemo(() => panier.reduce((somme, l) => somme + l.prix * l.quantite, 0), [panier])
  const nombreArticlesPanier = panier.reduce((somme, l) => somme + l.quantite, 0)
  const montantRecuNombre = Number(montantRecu) || 0
  const monnaieRendue = Math.max(0, montantRecuNombre - total)
  const paiementValide = montantRecuNombre >= total && total > 0

  function ajouterAuPanier(produit) {
    setPanier((current) => {
      const existant = current.find((l) => l.produitId === produit.id)
      if (existant) {
        return current.map((l) => (l.produitId === produit.id ? { ...l, quantite: l.quantite + 1 } : l))
      }
      return [...current, { produitId: produit.id, nom: produit.nom, prix: produit.prix, quantite: 1 }]
    })
  }

  function changerQuantite(produitId, delta) {
    setPanier((current) => current
      .map((l) => (l.produitId === produitId ? { ...l, quantite: l.quantite + delta } : l))
      .filter((l) => l.quantite > 0))
  }

  function retirerDuPanier(produitId) {
    setPanier((current) => current.filter((l) => l.produitId !== produitId))
  }

  function viderPanier() {
    setPanier([])
  }

  function ouvrirPaiement() {
    if (panier.length === 0) return
    setMontantRecu('')
    setPaiementOuvert(true)
  }

  function confirmerPaiement(e) {
    e.preventDefault()
    if (!paiementValide) return
    const vente = enregistrerVente({ lignes: panier, montantRecu: montantRecuNombre, vendeur: username })
    setDerniereVente(vente)
    setPaiementOuvert(false)
    setPanier([])
    setToast({ id: Date.now(), type: 'success', message: `Vente encaissée — Ticket n° ${vente.numero}.` })
  }

  function nouvelleVente() {
    setDerniereVente(null)
    setMontantRecu('')
  }

  if (derniereVente) {
    return (
      <Layout>
        <section className="vendeur-recu-page">
          <Recu vente={derniereVente} vendeurLabel={username || 'Vendeur'} onNouvelleVente={nouvelleVente} />
        </section>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="vendeur-pos">
        <section className="vendeur-pos-catalogue">
          <div className="vendeur-pos-head">
            <div>
              <p className="manager-eyebrow">Vendeur</p>
              <h1>Nouvelle vente</h1>
              <p>Sélectionnez les articles du comptoir, puis encaissez.</p>
            </div>
          </div>

          <div className="vendeur-pos-tabs" role="tablist" aria-label="Catégories">
            <button
              type="button"
              className={`vendeur-pos-tab ${categorieActive === 'toutes' ? 'is-active' : ''}`}
              onClick={() => setCategorieActive('toutes')}
            >
              Tout
            </button>
            {categoriesDisponibles.map((categorie) => (
              <button
                type="button"
                key={categorie.id}
                className={`vendeur-pos-tab ${categorieActive === categorie.id ? 'is-active' : ''}`}
                onClick={() => setCategorieActive(categorie.id)}
              >
                {categorie.nom}
              </button>
            ))}
          </div>

          {produitsAffiches.length === 0 ? (
            <div className="vendeur-pos-empty">Aucun produit disponible dans cette catégorie.</div>
          ) : (
            <div className="vendeur-pos-grid">
              {produitsAffiches.map((produit) => (
                <button
                  type="button"
                  key={produit.id}
                  className="vendeur-pos-card"
                  onClick={() => ajouterAuPanier(produit)}
                >
                  <span className="vendeur-pos-card-photo" style={{ backgroundImage: `url(${produit.photoUrl})` }} aria-hidden="true" />
                  <span className="vendeur-pos-card-body">
                    <strong>{produit.nom}</strong>
                    <span className="vendeur-pos-card-categorie">{categorieNomParId(produit.categorieId)}</span>
                    <span className="vendeur-pos-card-prix">{formatFCFA(produit.prix)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="vendeur-pos-panier" aria-label="Panier en cours">
          <div className="vendeur-pos-panier-head">
            <h2>Panier</h2>
            {panier.length > 0 && (
              <button type="button" className="vendeur-pos-vider" onClick={viderPanier}>
                Vider
              </button>
            )}
          </div>

          {panier.length === 0 ? (
            <p className="vendeur-pos-panier-empty">Touchez un produit pour l’ajouter au panier.</p>
          ) : (
            <ul className="vendeur-pos-panier-lignes">
              {panier.map((ligne) => (
                <li key={ligne.produitId}>
                  <span className="vendeur-pos-panier-nom">{ligne.nom}</span>
                  <span className="vendeur-pos-panier-qte">
                    <button type="button" aria-label="Retirer un" onClick={() => changerQuantite(ligne.produitId, -1)}>−</button>
                    <span>{ligne.quantite}</span>
                    <button type="button" aria-label="Ajouter un" onClick={() => changerQuantite(ligne.produitId, 1)}>+</button>
                  </span>
                  <span className="vendeur-pos-panier-prix">{formatFCFA(ligne.prix * ligne.quantite)}</span>
                  <button type="button" className="vendeur-pos-panier-retirer" aria-label={`Retirer ${ligne.nom} du panier`} onClick={() => retirerDuPanier(ligne.produitId)}>
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="vendeur-pos-panier-total">
            <span>Total ({nombreArticlesPanier} article{nombreArticlesPanier > 1 ? 's' : ''})</span>
            <strong>{formatFCFA(total)}</strong>
          </div>

          <button
            type="button"
            className="manager-button manager-button-primary vendeur-pos-encaisser"
            disabled={panier.length === 0}
            onClick={ouvrirPaiement}
          >
            Encaisser →
          </button>
        </aside>
      </div>

      {paiementOuvert && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setPaiementOuvert(false)}>
          <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="paiement-modal-title">
            <div className="manager-modal-header">
              <div>
                <p className="manager-eyebrow">Encaissement</p>
                <h2 id="paiement-modal-title">Paiement en espèces</h2>
              </div>
              <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={() => setPaiementOuvert(false)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <form className="manager-modal-form" onSubmit={confirmerPaiement}>
              <div className="vendeur-pos-paiement-total">
                <span>Total à payer</span>
                <strong>{formatFCFA(total)}</strong>
              </div>
              <label>
                Montant reçu (F CFA)
                <input
                  type="number"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  autoFocus
                  value={montantRecu}
                  onChange={(e) => setMontantRecu(e.target.value)}
                  required
                />
              </label>
              <div className="vendeur-pos-paiement-monnaie">
                <span>Monnaie à rendre</span>
                <strong>{formatFCFA(monnaieRendue)}</strong>
              </div>
              <div className="manager-modal-actions">
                <button className="manager-button manager-button-quiet" type="button" onClick={() => setPaiementOuvert(false)}>
                  Annuler
                </button>
                <button className="manager-button manager-button-primary" type="submit" disabled={!paiementValide}>
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
