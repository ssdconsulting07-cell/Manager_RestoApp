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
// — retour utilisateur. Seulement 3 cartes de statut (recue / en
// preparation / prete) : EN_LIVRAISON ne forme pas une 4e carte a part
// (retour utilisateur explicite : "laisse ça en prête") — une commande
// envoyee au livreur reste rangee sous le filtre "Prêtes" (voir counts et
// filtrees plus bas), avec juste une note "En livraison" a la place du
// bouton d'action (voir EMPTY_ACTION et CommandeRow.jsx) pour la
// distinguer visuellement sans lui dedier son propre filtre.
// Pas de carte "Toutes" (retour utilisateur) : seulement les cartes de
// statut, toujours une seule active a la fois — exactement comme Produits/
// Categories/Annonces (voir changerFiltre). Il y a eu une version
// intermediaire ou re-cliquer la carte active desactivait le filtre pour
// tout reafficher (double-clic retour utilisateur : c'etait confondu avec
// un rafraichissement et pretait a confusion) ; ce comportement est retire,
// changerFiltre selectionne simplement la carte cliquee. Par defaut, le
// filtre demarre sur "Reçue" (PAYEE) : l'ecran ouvre direct sur les
// commandes a traiter en priorite.
// FILTER_DEFS derive de STATUT_META (cuisineUtils.js), partage avec le
// badge de statut de chaque ligne (CommandeRow.jsx) : memes couleurs des
// deux cotes.
const FILTER_DEFS = [
  { key: 'PAYEE', ...STATUT_META.PAYEE, label: 'Reçues' },
  { key: 'EN_PREPARATION', ...STATUT_META.EN_PREPARATION },
  { key: 'PRETE', ...STATUT_META.PRETE, label: 'Prêtes' },
]

const FILTER_LABELS = Object.fromEntries(FILTER_DEFS.map((f) => [f.key, f.label]))
const ROWS_OPTIONS = [5, 10, 25]

// Note statique affichee a la place du bouton d'action quand CUISINE n'a
// aucune transition sortante (voir transitions.js) : PRETE en mode retrait/
// comptoir (rien a faire, client vient chercher) et EN_LIVRAISON (rien a
// faire non plus, c'est au tour de LIVREUR). PRETE en mode livraison a sa
// propre transition ("Envoyer au livreur"), donc ne passe jamais par ici.
const EMPTY_ACTION = {
  PRETE: { label: 'En attente de retrait', icon: 'fa-circle-check' },
  EN_LIVRAISON: { label: 'En livraison', icon: 'fa-motorcycle' },
}

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

  const [filter, setFilter] = useState('PAYEE')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[1])
  const [rafraichissement, setRafraichissement] = useState(false)

  function changerFiltre(key) {
    setFilter(key)
    setPage(1)
  }

  // Etat local au bouton, distinct de `loading` du hook (qui ne reflete que
  // le tout premier chargement) — permet de faire tourner l'icone et
  // desactiver le bouton pendant un clic manuel, sans toucher au polling
  // automatique de useCuisineBoard.
  async function handleRafraichir() {
    setRafraichissement(true)
    try {
      await charger()
    } finally {
      setRafraichissement(false)
    }
  }

  // EN_LIVRAISON compte avec PRETE (une seule carte "Prêtes" pour les deux,
  // voir FILTER_DEFS plus haut) : la commande envoyee au livreur reste
  // comptee ici, pas sous une carte separee.
  const counts = useMemo(() => {
    const parStatut = { PAYEE: 0, EN_PREPARATION: 0, PRETE: 0 }
    for (const commande of commandes) {
      const cle = commande.statut === 'EN_LIVRAISON' ? 'PRETE' : commande.statut
      if (parStatut[cle] !== undefined) parStatut[cle] += 1
    }
    return parStatut
  }, [commandes])

  // Meme logique : le filtre "PRETE" englobe aussi EN_LIVRAISON, pour que
  // la commande reste visible au meme endroit une fois envoyee au livreur
  // (voir le commentaire sur FILTER_DEFS).
  const filtrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return commandes.filter(
      (c) =>
        (c.statut === filter || (filter === 'PRETE' && c.statut === 'EN_LIVRAISON')) &&
        correspondRecherche(c, produits, query),
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
        {/* 3 cartes de statut, toujours une seule active (voir changerFiltre
            plus haut) — EN_LIVRAISON n'a pas sa propre carte (retour
            utilisateur), elle est comptee avec "Prêtes" (voir counts). */}
        <StatFilterCards
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
          {/* Bouton dedie (pas le manager-icon-button generique partage avec
              les fermetures de modale) : retour utilisateur — trop discret
              pour une action utile en plein service. Libelle visible, cible
              tactile >= 44px, et icone qui tourne pendant le rechargement
              (rafraichissement local, independant du polling 15s du hook)
              pour confirmer que le clic a bien ete pris en compte. */}
          <button
            type="button"
            className="cuisine-refresh-button"
            onClick={handleRafraichir}
            disabled={rafraichissement}
            aria-label="Actualiser les commandes"
          >
            <i className={`fa-solid fa-arrows-rotate${rafraichissement ? ' is-spinning' : ''}`} aria-hidden="true" />
            Actualiser
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
            Aucune commande « {FILTER_LABELS[filter].toLowerCase()} » pour le moment.
          </p>
        ) : (
          <div className="crud-list">
            {visibles.map((commande) => (
              <CommandeRow
                key={commande.id}
                commande={commande}
                produits={produits}
                showDuree
                transitions={allowedTransitions(commande, role)}
                pending={pendingId === commande.id}
                onTransition={(statut) => changerStatut(commande, statut)}
                emptyActionLabel={EMPTY_ACTION[commande.statut]?.label ?? null}
                emptyActionIcon={EMPTY_ACTION[commande.statut]?.icon}
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
