import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useMenuData } from '../gerant/MenuDataContext.jsx'
import { CATEGORIE_PLATS_DU_JOUR_ID } from '../gerant/menuData.js'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { enregistrerVente } from './ventesData.js'
import Recu from './Recu.jsx'
import './vendeur-pos.css'

// Espace Vendeur/Caissier (V2) : prise de commande au comptoir, encaissement
// especes, recu — dans l'esprit d'une caisse de type McDonald's/Starbucks.
// Catalogue mock reutilise de l'espace Gerant (memes produits, memes
// categories) : un seul menu dans l'app, pas de duplication.
//
// Parcours en etapes (stepper), conforme aux criteres de Bastien & Scapin :
// Produits -> Accompagnements (seulement si au moins un plat eligible dans le
// panier, sinon l'etape est sautee — Guidage/Charge de travail) -> Paiement
// -> Ticket. Le panier reste visible en permanence (Controle explicite),
// mais n'est modifiable (quantites, suppression) qu'a l'etape Produits : une
// fois l'etape quittee, la commande est consideree validee pour la suite du
// parcours (Homogeneite avec le reste de l'appli, pas de retour arriere
// silencieux sur le contenu).
const CATEGORIE_FILTRES = [
  {
    key: 'plats',
    label: 'Plats',
    icon: 'fa-burger',
    accent: '#a6192e',
    accentBg: '#fbeaec',
    match: (produit, ids) => produit.categorieId === ids.burgers,
  },
  {
    key: 'plat-du-jour',
    label: 'Plat du jour',
    icon: 'fa-calendar-day',
    accent: '#9c6b0c',
    accentBg: '#f6ecd9',
    match: (produit, ids) => produit.categorieId === ids.platDuJour || Boolean(produit.platDuJour),
  },
  {
    key: 'dessert',
    label: 'Dessert',
    icon: 'fa-ice-cream',
    accent: '#7a4fb5',
    accentBg: '#efe7fa',
    match: (produit, ids) => produit.categorieId === ids.dessert,
  },
  {
    key: 'boisson',
    label: 'Boisson',
    icon: 'fa-martini-glass-citrus',
    accent: '#1f6f57',
    accentBg: '#e2f2ec',
    match: (produit, ids) => produit.categorieId === ids.boisson,
  },
]

const TRI_OPTIONS = [
  { value: 'nom', label: 'Nom (A→Z)' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
]

const ROWS_OPTIONS = [8, 12, 24]

const ETAPE_LABELS = {
  produits: 'Produits',
  accompagnements: 'Accompagnements',
  paiement: 'Paiement',
}

function idParNom(categories, nom) {
  return categories.find((c) => c.nom === nom)?.id ?? null
}

export default function Vente() {
  const { username } = useAuth()
  const { categories, produits, categorieNomParId } = useMenuData()

  const [etape, setEtape] = useState('produits')
  const [categorieActive, setCategorieActive] = useState('plats')
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('nom')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [panier, setPanier] = useState([])
  const [montantRecu, setMontantRecu] = useState('')
  const [derniereVente, setDerniereVente] = useState(null)
  const [toast, setToast] = useState(null)

  // Resolution par NOM (pas par id en dur) : robuste si les donnees mock
  // changent, meme logique que categorieNomParId cote Gerant.
  const categorieIds = useMemo(() => ({
    burgers: idParNom(categories, 'Burgers'),
    accompagnements: idParNom(categories, 'Accompagnements'),
    dessert: idParNom(categories, 'Desserts'),
    boisson: idParNom(categories, 'Boissons'),
    platDuJour: CATEGORIE_PLATS_DU_JOUR_ID,
  }), [categories])

  const produitsDisponibles = useMemo(
    () => produits.filter((p) => p.statut === 'ACTIF' && p.disponibilite === 'EN_STOCK'),
    [produits],
  )

  const accompagnementsDisponibles = useMemo(
    () => produitsDisponibles.filter((p) => p.categorieId === categorieIds.accompagnements),
    [produitsDisponibles, categorieIds],
  )

  const comptesParFiltre = useMemo(() => {
    const comptes = {}
    CATEGORIE_FILTRES.forEach((f) => {
      comptes[f.key] = produitsDisponibles.filter((p) => f.match(p, categorieIds)).length
    })
    return comptes
  }, [produitsDisponibles, categorieIds])

  const filtreActif = CATEGORIE_FILTRES.find((f) => f.key === categorieActive) ?? CATEGORIE_FILTRES[0]

  const produitsFiltres = useMemo(() => {
    const query = recherche.trim().toLowerCase()
    const liste = produitsDisponibles
      .filter((p) => filtreActif.match(p, categorieIds))
      .filter((p) => !query || p.nom.toLowerCase().includes(query))
    const tries = [...liste]
    if (tri === 'prix-asc') tries.sort((a, b) => a.prix - b.prix)
    else if (tri === 'prix-desc') tries.sort((a, b) => b.prix - a.prix)
    else tries.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    return tries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produitsDisponibles, filtreActif, categorieIds, recherche, tri])

  const pageCount = Math.max(1, Math.ceil(produitsFiltres.length / rows))
  const produitsAffiches = produitsFiltres.slice((page - 1) * rows, page * rows)

  const total = useMemo(() => panier.reduce((somme, l) => somme + l.prix * l.quantite, 0), [panier])
  const nombreArticlesPanier = panier.reduce((somme, l) => somme + l.quantite, 0)
  const montantRecuNombre = Number(montantRecu) || 0
  const monnaieRendue = Math.max(0, montantRecuNombre - total)
  const paiementValide = montantRecuNombre >= total && total > 0

  // Lignes du panier eligibles a un accompagnement (Burgers / Plats du jour).
  const lignesEligibles = panier.filter((l) => l.accompagnementEligible)
  const aDesLignesEligibles = lignesEligibles.length > 0

  function changerCategorie(key) {
    setCategorieActive(key)
    setRecherche('')
    setPage(1)
  }

  function ajouterAuPanier(produit) {
    setPanier((current) => {
      const existant = current.find((l) => l.produitId === produit.id)
      if (existant) {
        return current.map((l) => (l.produitId === produit.id ? { ...l, quantite: l.quantite + 1 } : l))
      }
      const accompagnementEligible = produit.categorieId === categorieIds.burgers
        || produit.categorieId === categorieIds.platDuJour
        || Boolean(produit.platDuJour)
      return [...current, {
        produitId: produit.id,
        nom: produit.nom,
        categorieId: produit.categorieId,
        prixBase: produit.prix,
        prix: produit.prix,
        accompagnementEligible,
        accompagnementId: null,
        accompagnementNom: null,
        quantite: 1,
      }]
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

  function choisirAccompagnement(produitId, accompagnementId) {
    setPanier((current) => current.map((l) => {
      if (l.produitId !== produitId) return l
      if (!accompagnementId) {
        return { ...l, prix: l.prixBase, accompagnementId: null, accompagnementNom: null }
      }
      const accompagnement = accompagnementsDisponibles.find((a) => a.id === accompagnementId)
      if (!accompagnement) return l
      return {
        ...l,
        prix: l.prixBase + accompagnement.prix,
        accompagnementId: accompagnement.id,
        accompagnementNom: accompagnement.nom,
      }
    }))
  }

  function allerAEtapeSuivante() {
    if (etape === 'produits') {
      if (panier.length === 0) return
      setEtape(aDesLignesEligibles ? 'accompagnements' : 'paiement')
    } else if (etape === 'accompagnements') {
      setEtape('paiement')
    }
  }

  function revenirEtapePrecedente() {
    if (etape === 'paiement') {
      setEtape(aDesLignesEligibles ? 'accompagnements' : 'produits')
    } else if (etape === 'accompagnements') {
      setEtape('produits')
    }
  }

  function allerAEtape(key) {
    // Navigation retour uniquement : on ne peut pas sauter une etape en
    // cliquant en avant (Controle explicite, Gestion des erreurs).
    const ordre = aDesLignesEligibles ? ['produits', 'accompagnements', 'paiement'] : ['produits', 'paiement']
    const indexCible = ordre.indexOf(key)
    const indexActuel = ordre.indexOf(etape)
    if (indexCible === -1 || indexCible >= indexActuel) return
    setEtape(key)
  }

  function confirmerPaiement(e) {
    e.preventDefault()
    if (!paiementValide) return
    const vente = enregistrerVente({ lignes: panier, montantRecu: montantRecuNombre, vendeur: username })
    setDerniereVente(vente)
    setEtape('produits')
    setPanier([])
    setMontantRecu('')
    setToast({ id: Date.now(), type: 'success', message: `Vente encaissée — Ticket n° ${vente.numero}.` })
  }

  function nouvelleVente() {
    setDerniereVente(null)
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

  const etapesVisibles = aDesLignesEligibles ? ['produits', 'accompagnements', 'paiement'] : ['produits', 'paiement']
  const indexEtape = etapesVisibles.indexOf(etape)

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

          <nav className="vendeur-stepper" aria-label="Étapes de la vente">
            {etapesVisibles.map((key, index) => (
              <button
                type="button"
                key={key}
                className={`vendeur-stepper-step ${index === indexEtape ? 'is-active' : ''} ${index < indexEtape ? 'is-done' : ''}`}
                aria-current={index === indexEtape ? 'step' : undefined}
                disabled={index >= indexEtape}
                onClick={() => allerAEtape(key)}
              >
                <span className="vendeur-stepper-bullet">{index < indexEtape ? <i className="fa-solid fa-check" aria-hidden="true" /> : index + 1}</span>
                <span className="vendeur-stepper-label">{ETAPE_LABELS[key]}</span>
              </button>
            ))}
          </nav>

          {etape === 'produits' && (
            <>
              <StatFilterCards
                items={CATEGORIE_FILTRES.map((f) => ({ ...f, value: comptesParFiltre[f.key] }))}
                selected={categorieActive}
                onSelect={changerCategorie}
                ariaLabel="Filtrer par catégorie"
                className="is-4col"
              />

              <div className="crud-toolbar">
                <div className="crud-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Rechercher un produit"
                    placeholder="Rechercher un produit…"
                    value={recherche}
                    onChange={(e) => { setRecherche(e.target.value); setPage(1) }}
                  />
                </div>
                <span className="crud-toolbar-spacer" />
                <select
                  className="crud-select"
                  aria-label="Trier par"
                  value={tri}
                  onChange={(e) => { setTri(e.target.value); setPage(1) }}
                >
                  {TRI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
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

              <Pagination
                page={page}
                pageCount={pageCount}
                rowsPerPage={rows}
                totalItems={produitsFiltres.length}
                onPageChange={setPage}
                onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
                rowsOptions={ROWS_OPTIONS}
              />
            </>
          )}

          {etape === 'accompagnements' && (
            <div className="vendeur-stepper-panel">
              <h2>Choisissez un accompagnement</h2>
              <p className="vendeur-stepper-panel-hint">Facultatif — laissez « Aucun accompagnement » si le client n’en souhaite pas.</p>
              <ul className="vendeur-accomp-liste">
                {lignesEligibles.map((ligne) => (
                  <li key={ligne.produitId} className="vendeur-accomp-ligne">
                    <span className="vendeur-accomp-nom">{ligne.quantite}× {ligne.nom}</span>
                    <select
                      className="crud-select"
                      aria-label={`Accompagnement pour ${ligne.nom}`}
                      value={ligne.accompagnementId || ''}
                      onChange={(e) => choisirAccompagnement(ligne.produitId, e.target.value)}
                    >
                      <option value="">Aucun accompagnement</option>
                      {accompagnementsDisponibles.map((a) => (
                        <option key={a.id} value={a.id}>{a.nom} (+{formatFCFA(a.prix)})</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {etape === 'paiement' && (
            <div className="vendeur-stepper-panel">
              <h2>Paiement en espèces</h2>
              <form className="vendeur-paiement-form" onSubmit={confirmerPaiement}>
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
                  <button className="manager-button manager-button-quiet" type="button" onClick={revenirEtapePrecedente}>
                    ← Retour
                  </button>
                  <button className="manager-button manager-button-primary" type="submit" disabled={!paiementValide}>
                    Confirmer le paiement
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <aside className="vendeur-pos-panier" aria-label="Panier en cours">
          <div className="vendeur-pos-panier-head">
            <h2>Panier</h2>
            {etape === 'produits' && panier.length > 0 && (
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
                  <span className="vendeur-pos-panier-nom">
                    {ligne.nom}
                    {ligne.accompagnementNom && <span className="vendeur-pos-panier-accomp"> + {ligne.accompagnementNom}</span>}
                  </span>
                  {etape === 'produits' ? (
                    <span className="vendeur-pos-panier-qte">
                      <button type="button" aria-label="Retirer un" onClick={() => changerQuantite(ligne.produitId, -1)}>−</button>
                      <span>{ligne.quantite}</span>
                      <button type="button" aria-label="Ajouter un" onClick={() => changerQuantite(ligne.produitId, 1)}>+</button>
                    </span>
                  ) : (
                    <span className="vendeur-pos-panier-qte vendeur-pos-panier-qte-figee">×{ligne.quantite}</span>
                  )}
                  <span className="vendeur-pos-panier-prix">{formatFCFA(ligne.prix * ligne.quantite)}</span>
                  {etape === 'produits' && (
                    <button type="button" className="vendeur-pos-panier-retirer" aria-label={`Retirer ${ligne.nom} du panier`} onClick={() => retirerDuPanier(ligne.produitId)}>
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="vendeur-pos-panier-total">
            <span>Total ({nombreArticlesPanier} article{nombreArticlesPanier > 1 ? 's' : ''})</span>
            <strong>{formatFCFA(total)}</strong>
          </div>

          {etape !== 'paiement' && (
            <div className="vendeur-pos-panier-nav">
              {etape !== 'produits' && (
                <button type="button" className="manager-button manager-button-quiet" onClick={revenirEtapePrecedente}>
                  ← Retour
                </button>
              )}
              <button
                type="button"
                className="manager-button manager-button-primary vendeur-pos-encaisser"
                disabled={panier.length === 0}
                aria-label={etape === 'produits' && aDesLignesEligibles ? 'Continuer vers les accompagnements' : 'Continuer vers le paiement'}
                onClick={allerAEtapeSuivante}
              >
                {etape === 'produits' && aDesLignesEligibles ? 'Accompagnements →' : 'Paiement →'}
              </button>
            </div>
          )}
        </aside>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
