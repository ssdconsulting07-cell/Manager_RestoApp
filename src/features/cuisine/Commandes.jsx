import { Link } from 'react-router-dom'
import { allowedTransitions } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import CommandeRow from './CommandeRow.jsx'
import { useCuisineBoard } from './useCuisineBoard.js'
import './cuisine-board.css'

const PRIMARY = ['PAYEE']

export default function Commandes() {
  const { role, items, sideCount, produits, loading, error, demo, pendingId, charger, changerStatut } =
    useCuisineBoard({ primaryStatuts: PRIMARY, secondaryStatut: 'EN_PREPARATION' })

  return (
    <Layout>
      <div className="cuisine-board-head">
        <div>
          <p className="manager-eyebrow">Cuisine{demo ? ' · démo' : ''}</p>
          <h1>Commandes reçues</h1>
          <p>Démarrez la préparation pour envoyer au poste.</p>
        </div>
        <div className="cuisine-board-tools">
          {sideCount > 0 && (
            <Link to="/preparation" className="cuisine-board-chip">
              <i className="fa-solid fa-fire-burner" aria-hidden="true" />
              {sideCount} en cours
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
        <PageSkeleton page="commandes" contentOnly />
      ) : items.length === 0 ? (
        <div className="cuisine-board-empty">
          <h2>File vide</h2>
          <p>{sideCount > 0 ? `${sideCount} déjà en préparation.` : 'En attente des prochaines commandes payées.'}</p>
          {sideCount > 0 && (
            <Link className="manager-button manager-button-primary" to="/preparation">
              Voir la préparation →
            </Link>
          )}
        </div>
      ) : (
        <div className="cuisine-board-grid">
          {items.map((commande) => (
            <CommandeRow
              key={commande.id}
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
