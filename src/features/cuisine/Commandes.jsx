import { useMemo, useState } from 'react'
import { allowedTransitions } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import CommandeRow from './CommandeRow.jsx'
import { STATUT_META, nomProduit, noteCommande } from './cuisineUtils.js'
import { useAlerteNouvelleCommande } from './useAlerteNouvelleCommande.js'
import { useCuisineBoard } from './useCuisineBoard.js'
import './cuisine-board.css'

// Tableau du poste cuisine, aligne sur le meme patron que les autres listes
// de l'appli (Produits, Journal d'audit, ...) : cartes de statistiques qui
// servent aussi de filtres, barre de recherche, grille de cartes, pagination
// — retour utilisateur. Les 3 etapes (recue / en preparation / prete) ne
// sont plus 3 colonnes paralleles mais un seul statut filtrable a la fois,
// avec "Toutes" selectionne par defaut pour ne rien cacher d'entree : une
// commande marquee prete reste donc toujours visible sans aucune action du
// personnel — c'est le filtre "Toutes" par defaut qui le garantit, pas la
// mise en page (l'ancien decoupage en 3 colonnes n'est plus necessaire pour
// ca, voir cuisineDemo.js pour l'historique du bug que ca corrigeait).
// Derive de STATUT_META (cuisineUtils.js), partage avec le badge de statut
// de chaque carte (CommandeRow.jsx) : memes couleurs des deux cotes. Seul
// "Toutes" n'est pas un vrai statut et reste donc defini ici.
const FILTER_DEFS = [
  { key: 'TOUS', label: 'Toutes', icon: 'fa-layer-group', accent: '#a6192e', accentBg: '#f8e9ec' },
  { key: 'PAYEE', ...STATUT_META.PAYEE, label: 'Reçues' },
  { key: 'EN_PREPARATION', ...STATUT_META.EN_PREPARATION },
  { key: 'PRETE', ...STATUT_META.PRETE, label: 'Prêtes' },
]

const FILTER_LABELS = Object.fromEntries(FILTER_DEFS.map((f) => [f.key, f.label]))
const ROWS_OPTIONS = [5, 10, 25]

function correspondRecherche(commande, produits, query) {
  if (!query) return true
  const idTexte = String(commande.id).replace(/^demo-/, '').toLowerCase()
  if (idTexte.includes(query)) return true
  const note = noteCommande(commande)
  if (note && note.toLowerCase().includes(query)) return true
  return (commande.lignes || []).some((ligne) => nomProduit(produits, ligne.produitId).toLowerCase().includes(query))
}

export default function Commandes() {
  const {
    role,
    commandes,
    produits,
    loading,
    error,
    demo,
    pendingId,
    nouvelleAlerte,
    charger,
    changerStatut,
    clearAlerte,
  } = useCuisineBoard()

  const [filter, setFilter] = useState('TOUS')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[1])

  function changerFiltre(key) {
    setFilter(key)
    setPage(1)
  }

  const counts = useMemo(() => {
    const parStatut = { PAYEE: 0, EN_PREPARATION: 0, PRETE: 0 }
    for (const commande of commandes) parStatut[commande.statut] += 1
    return { TOUS: commandes.length, ...parStatut }
  }, [commandes])

  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return commandes.filter(
      (c) => (filter === 'TOUS' || c.statut === filter) && correspondRecherche(c, produits, query),
    )
  }, [commandes, filter, search, produits])

  // filtrees retrecit toute seule (rafraichissement 15 s, retrait, changement
  // de statut) — contrairement a Produits/Journal d'audit, page doit donc
  // etre ramenee dans les bornes a chaque rendu, sinon un passage en page 2
  // peut se retrouver sans la moindre commande alors que la page 1 en a
  // toujours (retour relecture : message "Aucune commande" trompeur sur un
  // poste de cuisine en plein service).
  const pageCount = Math.max(1, Math.ceil(filtrees.length / rows))
  const pageCourante = Math.min(page, pageCount)
  const visibles = filtrees.slice((pageCourante - 1) * rows, pageCourante * rows)

  // Toast + bip sonore sur une nouvelle commande payee : logique partagee
  // avec CuisineDashboard.jsx (meme hook, voir useAlerteNouvelleCommande.js)
  // pour que les deux ecrans reagissent pareil.
  const toast = useAlerteNouvelleCommande(nouvelleAlerte)

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Cuisine{demo ? ' · démo' : ''}</p>
          <h1>Suivi des commandes</h1>
          <p>Du paiement au retrait, sur un seul écran.</p>
        </div>
      </section>

      <section>
        <StatFilterCards
          className="is-4col"
          items={FILTER_DEFS.map((f) => ({ ...f, value: counts[f.key] }))}
          selected={filter}
          onSelect={changerFiltre}
          ariaLabel="Filtrer les commandes par statut"
        />

        <div className="crud-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="N° de ticket, plat ou note…"
              aria-label="Rechercher une commande"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button type="button" className="manager-icon-button" onClick={charger} aria-label="Actualiser">
            <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
          </button>
        </div>

        {/* L'erreur brute de l'API (ex. "Une erreur inattendue est survenue")
            ne s'affiche que si on n'est PAS deja replie sur la demo : en
            demo, le badge "· démo" ci-dessus suffit a signaler la situation,
            et montrer en plus ce texte technique n'apportait rien (retour
            utilisateur). Une erreur d'action (ex. 403 sur changerStatut)
            reste affichee normalement, elle, puisqu'elle ne coincide pas
            forcement avec un passage en demo. */}
        {error && !demo && (
          <p role="alert" className="cuisine-board-error">
            {error}
          </p>
        )}

        {loading ? (
          <PageSkeleton page="commandes" contentOnly />
        ) : visibles.length === 0 ? (
          <p className="crud-empty">
            {filter === 'TOUS'
              ? 'Aucune commande pour le moment.'
              : `Aucune commande « ${FILTER_LABELS[filter].toLowerCase()} » pour le moment.`}
          </p>
        ) : (
          <div className="crud-grid">
            {visibles.map((commande) => (
              <CommandeRow
                key={commande.id}
                commande={commande}
                produits={produits}
                showDuree
                transitions={allowedTransitions(commande, role)}
                pending={pendingId === commande.id}
                onTransition={(statut) => changerStatut(commande, statut)}
                emptyActionLabel={commande.statut === 'PRETE' ? 'En attente de retrait' : null}
              />
            ))}
          </div>
        )}

        <Pagination
          page={pageCourante}
          pageCount={pageCount}
          rowsPerPage={rows}
          totalItems={filtrees.length}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      <Toast toast={toast} onClose={clearAlerte} />
    </Layout>
  )
}
