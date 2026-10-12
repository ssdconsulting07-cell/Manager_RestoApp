import { Link } from 'react-router-dom'
import { allowedTransitions } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import CommandeRow from './CommandeRow.jsx'
import { useCuisineBoard } from './useCuisineBoard.js'
import './cuisine-board.css'

const PRIMARY = ['EN_PREPARATION']

export default function Preparation() {
  const { role, items, sideCount, produits, loading, error, demo, pendingId, charger, changerStatut } =
    useCuisineBoard({ primaryStatuts: PRIMARY, secondaryStatut: 'PAYEE' })

  return (
    <Layout>
      <div className="cuisine-board-head">
        <div>
          <p className="manager-eyebrow">Cuisine{demo ? ' · démo' : ''}</p>
          <h1>Préparation</h1>
          <p>Marquez prêtes dès que c’est terminé.</p>
        </div>
        <div className="cuisine-board-tools">
          {sideCount > 0 && (
            <Link to="/commandes" className="cuisine-board-chip">
              <i className="fa-solid fa-bell" aria-hidden="true" />
              {sideCount} en attente
            </Link>
          )}
          <button type="button" onClick={charger} className="cuisine-board-tool" aria-label="Actualiser">
            <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="cuisine-board-error">
          {error}
        </p>
      )}

      {loading ? (
        <PageSkeleton page="preparation" contentOnly />
      ) : items.length === 0 ? (
        <div className="cuisine-board-empty">
          <h2>Poste libre</h2>
          <p>{sideCount > 0 ? `${sideCount} en file d’attente.` : 'Rien en préparation pour le moment.'}</p>
          {sideCount > 0 && (
            <Link className="manager-button manager-button-primary" to="/commandes">
              Voir la file →
            </Link>
          )}
        </div>
      ) : (
        <div className="cuisine-board-grid">
          {items.map((commande) => (
            <CommandeRow
              key={commande.id}
              showDuree
              commande={commande}
              produits={produits}
              transitions={allowedTransitions(commande, role)}
              pending={pendingId === commande.id}
              onTransition={(statut) => changerStatut(commande, statut)}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
