import { useEffect, useMemo, useRef, useState } from 'react'
import { allowedTransitions } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton, { CommandeRowsSkeleton } from '../../components/PageSkeleton.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import CommandeRow from '../cuisine/CommandeRow.jsx'
import { STATUT_META, estAujourdhui, nomProduit, noteCommande, ticketId } from '../cuisine/cuisineUtils.js'
import '../cuisine/cuisine-board.css'
import ScanLivraisonModal from './ScanLivraisonModal.jsx'
import { useAlerteNouvelleLivraison } from './useAlerteNouvelleLivraison.js'
import { useLivreurBoard } from './useLivreurBoard.js'

// Ecran principal du livreur, sur le meme patron que Commandes.jsx cote
// Cuisine (cartes-filtres qui servent aussi de compteurs, recherche,
// squelettes, pagination) — retour utilisateur. Trois cartes : « À
// récupérer » (PRETE en mode livraison — la cuisine n'a pas encore envoye,
// mais desormais actionnable aussi cote Livreur via « Récupéré », voir
// transitions.js), « En livraison » (EN_LIVRAISON, actionnable : scan QR
// pour marquer livree, voir ScanLivraisonModal.jsx) et « Livrées »
// (lecture seule, limitee aux livraisons DU JOUR — retour utilisateur du
// 16/10/2026 — l'historique complet, toutes periodes, reste sur son propre
// ecran, HistoriqueLivraisons.jsx, pour ne pas dupliquer cette vue-la).
const FILTER_DEFS = [
  { key: 'PRETE', ...STATUT_META.PRETE, label: 'À récupérer' },
  { key: 'EN_LIVRAISON', ...STATUT_META.EN_LIVRAISON, label: 'En livraison' },
  { key: 'LIVREE', ...STATUT_META.LIVREE, label: 'Livrées' },
]

const FILTER_LABELS = Object.fromEntries(FILTER_DEFS.map((f) => [f.key, f.label]))
const ROWS_OPTIONS = [5, 10, 25]

function correspondRecherche(commande, produits, query) {
  if (!query) return true
  if (ticketId(commande).toLowerCase().includes(query)) return true
  const note = noteCommande(commande)
  if (note && note.toLowerCase().includes(query)) return true
  return (commande.lignes || []).some((ligne) => nomProduit(produits, ligne.produitId).toLowerCase().includes(query))
}

export default function Livraisons() {
  const {
    role,
    commandes,
    livrees,
    produits,
    loading,
    error,
    demo,
    pendingId,
    nouvelleAlerte,
    charger,
    changerStatut,
    clearAlerte,
  } = useLivreurBoard()

  // Par defaut sur « En livraison » (pas « À récupérer ») : c'est la ou le
  // livreur a quelque chose a faire maintenant (scanner), l'autre carte
  // n'etant que de la visibilite sur ce qui arrive.
  const [filter, setFilter] = useState('EN_LIVRAISON')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[1])
  const [rafraichissement, setRafraichissement] = useState(false)
  // Meme squelette de transition au changement de carte-filtre que
  // Commandes.jsx (voir son commentaire detaille sur ce choix, notamment
  // le gestionnaire de clic plutot qu'un useEffect a cause de
  // React.StrictMode).
  const [switching, setSwitching] = useState(false)
  const switchTimeoutRef = useRef(null)
  const [scanCible, setScanCible] = useState(null)

  useEffect(() => () => clearTimeout(switchTimeoutRef.current), [])

  function changerFiltre(key) {
    setFilter(key)
    setPage(1)
    setSwitching(true)
    clearTimeout(switchTimeoutRef.current)
    switchTimeoutRef.current = setTimeout(() => setSwitching(false), 300)
  }

  async function handleRafraichir() {
    setRafraichissement(true)
    try {
      await charger()
    } finally {
      setRafraichissement(false)
    }
  }

  // Limitees au jour courant (voir commentaire de FILTER_DEFS) — ne
  // depend que de `livrees` (renvoye a part par useLivreurBoard, jamais
  // dans `commandes`), recalculee seulement quand cette liste change.
  const livreesAujourdhui = useMemo(
    () => livrees.filter((c) => estAujourdhui(c.livreeLe)),
    [livrees],
  )

  const counts = useMemo(() => {
    const c = { PRETE: 0, EN_LIVRAISON: 0 }
    for (const commande of commandes) {
      if (c[commande.statut] !== undefined) c[commande.statut] += 1
    }
    c.LIVREE = livreesAujourdhui.length
    return c
  }, [commandes, livreesAujourdhui])

  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    // La carte « Livrées » puise dans livreesAujourdhui (statut LIVREE),
    // les deux autres dans commandes (PRETE/EN_LIVRAISON) — deux listes
    // distinctes cote useLivreurBoard, voir son commentaire. Tri le plus
    // recent d'abord pour les livrees (on vient de les terminer, pas
    // besoin d'ordre FIFO comme pour les commandes encore a traiter).
    if (filter === 'LIVREE') {
      return livreesAujourdhui
        .filter((c) => correspondRecherche(c, produits, query))
        .sort((a, b) => new Date(b.livreeLe || b.creeLe) - new Date(a.livreeLe || a.creeLe))
    }
    return commandes
      .filter((c) => c.statut === filter && correspondRecherche(c, produits, query))
      .sort((a, b) => new Date(a.creeLe) - new Date(b.creeLe))
  }, [commandes, livreesAujourdhui, filter, search, produits])

  const pageCount = Math.max(1, Math.ceil(filtrees.length / rows))
  const pageCourante = Math.min(page, pageCount)
  const visibles = filtrees.slice((pageCourante - 1) * rows, pageCourante * rows)

  const toast = useAlerteNouvelleLivraison(nouvelleAlerte)

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Livraison</p>
          <h1>Mes livraisons</h1>
          <p>Récupérez les commandes prêtes et confirmez chaque remise par scan.</p>
        </div>
      </section>

      <section>
        <StatFilterCards
          items={FILTER_DEFS.map((f) => ({ ...f, value: counts[f.key] }))}
          selected={filter}
          onSelect={changerFiltre}
          ariaLabel="Filtrer les livraisons par statut"
        />

        <div className="crud-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="N° de ticket ou plat…"
              aria-label="Rechercher une livraison"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button
            type="button"
            className="cuisine-refresh-button"
            onClick={handleRafraichir}
            disabled={rafraichissement}
            aria-label="Actualiser les livraisons"
          >
            <i className={`fa-solid fa-arrows-rotate${rafraichissement ? ' is-spinning' : ''}`} aria-hidden="true" />
            Actualiser
          </button>
        </div>

        {error && !demo && (
          <p role="alert" className="cuisine-board-error">
            {error}
          </p>
        )}

        {loading ? (
          <PageSkeleton page="livraisons" contentOnly />
        ) : switching || rafraichissement ? (
          <div role="status" aria-busy="true">
            <span className="page-skeleton-announcement">
              {rafraichissement ? 'Actualisation des livraisons…' : 'Changement de filtre…'}
            </span>
            <CommandeRowsSkeleton count={Math.max(visibles.length, 3)} />
          </div>
        ) : visibles.length === 0 ? (
          <p className="crud-empty">
            Aucune commande « {FILTER_LABELS[filter].toLowerCase()} » pour le moment.
          </p>
        ) : (
          <div className="crud-list">
            {visibles.map((commande) => (
              <CommandeRow
                key={commande.id}
                commande={commande}
                produits={produits}
                // Pas de duree/urgence affichee pour une commande deja
                // livree (filter === 'LIVREE') : estUrgente() ne regarde
                // que creeLe, donc une livraison livree il y a plus de 20
                // min se serait sinon affichee comme "en retard" alors
                // qu'elle est terminee — showDuree=false desactive les
                // deux d'un coup cote CommandeRow.
                showDuree={filter !== 'LIVREE'}
                transitions={allowedTransitions(commande, role)}
                pending={pendingId === commande.id}
                onTransition={(statut) => changerStatut(commande, statut)}
                onScanLivraison={(cmd) => setScanCible(cmd)}
                // PRETE et EN_LIVRAISON ont desormais toujours une
                // transition cote Livreur (Récupéré / Scanner QR, voir
                // transitions.js) : emptyActionLabel ne s'affiche plus que
                // pour LIVREE (aucune transition sortante, lecture seule).
                emptyActionLabel={commande.statut === 'LIVREE' ? 'Livrée' : null}
                emptyActionIcon="fa-flag-checkered"
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

      {scanCible && (
        <ScanLivraisonModal
          commande={scanCible}
          onConfirm={() => {
            changerStatut(scanCible, 'LIVREE')
            setScanCible(null)
          }}
          onCancel={() => setScanCible(null)}
        />
      )}

      <Toast toast={toast} onClose={clearAlerte} />
    </Layout>
  )
}
