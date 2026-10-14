import { useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import PanierPage from './PanierPage.jsx'
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
// Page catalogue a une seule colonne, homogene avec l'espace Gerant
// (StatFilterCards + toolbar + grille + pagination, cf. Produits.jsx) : plus
// de panier en colonne permanente (Homogeneite des interfaces). Le panier
// vit derriere un bouton "Panier" (badge = nombre d'articles, desactive si
// vide, Controle explicite — l'etat reste visible sans devoir l'ouvrir) qui
// bascule vers une page plein ecran dediee (PanierPage.jsx, meme pattern
// que le ticket qui remplace deja toute la page apres encaissement) : le
// panier n'est pas un modal, il a sa propre page avec son stepper (Panier
// -> Paiement). Ajouter un produit au panier (clic sur une carte) garde
// exactement la meme logique qu'avant ce changement.
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

function idParNom(categories, nom) {
  return categories.find((c) => c.nom === nom)?.id ?? null
}

export default function Vente() {
  const { username } = useAuth()
  const { categories, produits, categorieNomParId } = useMenuData()

  const [categorieActive, setCategorieActive] = useState('plats')
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('nom')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [panier, setPanier] = useState([])
  const [vue, setVue] = useState('catalogue')
  const [derniereVente, setDerniereVente] = useState(null)
  const [toast, setToast] = useState(null)

  // Identifiant stable par LIGNE de panier (independant du produit) : deux
  // lignes du meme produit peuvent coexister des qu'elles ont des
  // accompagnements differents (voir choisirAccompagnement ci-dessous).
  const ligneIdCounterRef = useRef(0)
  function nextLigneId() {
    ligneIdCounterRef.current += 1
    return `ligne-${ligneIdCounterRef.current}`
  }

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

  const nombreArticlesPanier = panier.reduce((somme, l) => somme + l.quantite, 0)

  function changerCategorie(key) {
    setCategorieActive(key)
    setRecherche('')
    setPage(1)
  }

  function ajouterAuPanier(produit) {
    setPanier((current) => {
      // Fusionne seulement avec une ligne du meme produit SANS accompagnement
      // deja choisi : des qu'un accompagnement differe d'une unite a
      // l'autre, impossible de fusionner (chaque unite doit pouvoir garder
      // le sien — deux burgers peuvent avoir deux accompagnements
      // differents, Controle explicite).
      const existant = current.find((l) => l.produitId === produit.id && !l.accompagnementId)
      if (existant) {
        return current.map((l) => (l.ligneId === existant.ligneId ? { ...l, quantite: l.quantite + 1 } : l))
      }
      const accompagnementEligible = produit.categorieId === categorieIds.burgers
        || produit.categorieId === categorieIds.platDuJour
        || Boolean(produit.platDuJour)
      return [...current, {
        ligneId: nextLigneId(),
        produitId: produit.id,
        nom: produit.nom,
        categorieId: produit.categorieId,
        photoUrl: produit.photoUrl,
        prixBase: produit.prix,
        prix: produit.prix,
        accompagnementEligible,
        accompagnementId: null,
        accompagnementNom: null,
        quantite: 1,
      }]
    })
  }

  function changerQuantite(ligneId, delta) {
    setPanier((current) => current
      .map((l) => (l.ligneId === ligneId ? { ...l, quantite: l.quantite + delta } : l))
      .filter((l) => l.quantite > 0))
  }

  function retirerDuPanier(ligneId) {
    setPanier((current) => current.filter((l) => l.ligneId !== ligneId))
  }

  function viderPanier() {
    setPanier([])
  }

  // Change l'accompagnement d'UNE ligne. Si la ligne ne compte qu'une seule
  // unite, on la modifie directement. Si elle en compte plusieurs (meme
  // produit ajoute plusieurs fois, pas encore personnalise), l'accompagnement
  // choisi ne peut s'appliquer qu'a une unite a la fois : on en detache une
  // dans sa propre ligne et on diminue la ligne d'origine d'une unite — deux
  // burgers peuvent ainsi garder des accompagnements differents (Controle
  // explicite : jamais d'application groupee silencieuse sur des unites que
  // l'utilisateur n'a pas individuellement choisies).
  function choisirAccompagnement(ligneId, accompagnementId) {
    setPanier((current) => {
      const ligne = current.find((l) => l.ligneId === ligneId)
      if (!ligne) return current

      const accompagnement = accompagnementId
        ? accompagnementsDisponibles.find((a) => a.id === accompagnementId)
        : null

      const appliquer = (l) => (accompagnement
        ? { ...l, prix: l.prixBase + accompagnement.prix, accompagnementId: accompagnement.id, accompagnementNom: accompagnement.nom }
        : { ...l, prix: l.prixBase, accompagnementId: null, accompagnementNom: null })

      if (ligne.quantite <= 1) {
        return current.map((l) => (l.ligneId === ligneId ? appliquer(l) : l))
      }

      const detachee = appliquer({ ...ligne, ligneId: nextLigneId(), quantite: 1 })
      return current
        .map((l) => (l.ligneId === ligneId ? { ...l, quantite: l.quantite - 1 } : l))
        .concat(detachee)
    })
  }

  function confirmerPaiement(modePaiement, montantRecuNombre) {
    const vente = enregistrerVente({ lignes: panier, montantRecu: montantRecuNombre, modePaiement, vendeur: username })
    setDerniereVente(vente)
    setPanier([])
    setVue('catalogue')
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

  if (vue === 'panier') {
    return (
      <PanierPage
        panier={panier}
        accompagnementsDisponibles={accompagnementsDisponibles}
        onChangerQuantite={changerQuantite}
        onRetirer={retirerDuPanier}
        onChoisirAccompagnement={choisirAccompagnement}
        onConfirmerPaiement={confirmerPaiement}
        onRetourCatalogue={() => setVue('catalogue')}
        onAnnuler={() => { viderPanier(); setVue('catalogue') }}
      />
    )
  }

  return (
    <Layout>
      <div className="vendeur-pos-page">
        <div className="vendeur-pos-head">
          <div>
            <p className="manager-eyebrow">Vendeur</p>
            <h1>Nouvelle vente</h1>
            <p>Sélectionnez les articles du comptoir, puis encaissez.</p>
          </div>
        </div>

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
          <button
            type="button"
            className="vendeur-pos-cart-button"
            disabled={nombreArticlesPanier === 0}
            onClick={() => setVue('panier')}
            aria-label={`Ouvrir le panier (${nombreArticlesPanier} article${nombreArticlesPanier > 1 ? 's' : ''})`}
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            Panier
            {nombreArticlesPanier > 0 && <span className="vendeur-pos-cart-badge">{nombreArticlesPanier}</span>}
          </button>
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
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
