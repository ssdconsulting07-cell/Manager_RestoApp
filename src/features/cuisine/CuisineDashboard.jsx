import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Toast from '../../components/Toast.jsx'
import { KpiCard, formatRelativeTime } from '../../components/dashboard/DashboardWidgets.jsx'
import { jouerAlerteSonore, nomProduit } from './cuisineUtils.js'
import { useCuisineBoard } from './useCuisineBoard.js'

// Tableau de bord Cuisine — meme structure et memes briques que les
// tableaux de bord Gerant/Manager/Vendeur (cartes KPI, flux d'activite
// recent), rendu par le tableau de bord generique (voir
// dashboard/Dashboard.jsx) plutot que dans son propre Layout. Reutilise
// useCuisineBoard (le meme hook que Commandes.jsx) pour ne pas dupliquer la
// logique demo / comptage par statut — un seul endroit a corriger si un
// bug comme celui de cuisineDemo.js (voir son historique) survient.
const APERCU_TICKETS = 6

export default function CuisineDashboard() {
  const { commandes, produits, loading, demo, nouvelleAlerte, clearAlerte } = useCuisineBoard()

  const counts = useMemo(() => {
    const c = { PAYEE: 0, EN_PREPARATION: 0, PRETE: 0 }
    for (const commande of commandes) c[commande.statut] += 1
    return c
  }, [commandes])

  const apercu = useMemo(
    () => commandes.filter((c) => c.statut === 'PAYEE' || c.statut === 'EN_PREPARATION').slice(0, APERCU_TICKETS),
    [commandes],
  )

  // Meme bip + toast que Commandes.jsx (retour relecture : la cuisine arrive
  // sur ce tableau de bord apres connexion — voir ROLE_HOME dans roles.js —
  // donc un poste qui y reste doit lui aussi entendre les nouvelles
  // commandes, pas seulement le tableau filtrable). nouvelleAlerte vient du
  // meme useCuisineBoard, pas d'une detection dupliquee ici.
  const toast = useMemo(() => {
    if (!nouvelleAlerte) return null
    const n = nouvelleAlerte.commandes.length
    return {
      id: nouvelleAlerte.at,
      type: 'info',
      message:
        n === 1
          ? `Nouvelle commande reçue — #${String(nouvelleAlerte.commandes[0].id).replace(/^demo-/, '')}`
          : `${n} nouvelles commandes reçues`,
    }
  }, [nouvelleAlerte])

  useEffect(() => {
    if (nouvelleAlerte) jouerAlerteSonore()
  }, [nouvelleAlerte])

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Résumé cuisine">
        <KpiCard
          icon="fa-layer-group" accent="brand" label="Commandes actives"
          value={loading ? '—' : counts.PAYEE + counts.EN_PREPARATION + counts.PRETE}
          detail={demo ? 'démo' : 'reçue → prête'} to="/commandes"
        />
        <KpiCard
          icon="fa-receipt" accent="red" label="Reçues"
          value={loading ? '—' : counts.PAYEE} detail="à démarrer" to="/commandes"
        />
        <KpiCard
          icon="fa-fire-burner" accent="amber" label="En préparation"
          value={loading ? '—' : counts.EN_PREPARATION} detail="au poste" to="/commandes"
        />
        <KpiCard
          icon="fa-circle-check" accent="green" label="Prêtes"
          value={loading ? '—' : counts.PRETE} detail="en attente de retrait" to="/commandes"
        />
      </section>

      <section className="dashboard-panel dashboard-activity-panel" aria-labelledby="cuisine-tickets-titre">
        <div className="dashboard-panel-heading">
          <div>
            <p className="manager-eyebrow">Ce que la cuisine reçoit</p>
            <h2 id="cuisine-tickets-titre">Prochains tickets</h2>
          </div>
        </div>

        {apercu.length === 0 ? (
          <p className="dashboard-chart-empty">
            {loading ? 'Chargement…' : 'Aucune commande à préparer pour le moment.'}
          </p>
        ) : (
          <ul className="dashboard-activity-list">
            {apercu.map((c) => {
              const premiere = c.lignes?.[0]
              return (
                <li key={c.id}>
                  <Link className="dashboard-activity-row" to="/commandes">
                    <span className="dashboard-activity-icon" aria-hidden="true">
                      <i className={`fa-solid ${c.statut === 'EN_PREPARATION' ? 'fa-fire-burner' : 'fa-receipt'}`} />
                    </span>
                    <span className="dashboard-activity-text">
                      <strong>#{String(c.id).replace(/^demo-/, '')}</strong>
                      <span>
                        {premiere
                          ? `${premiere.quantite}× ${nomProduit(produits, premiere.produitId)}`
                          : 'Sans lignes'}
                        {(c.lignes?.length || 0) > 1 ? ` +${c.lignes.length - 1}` : ''}
                        {' · '}
                        {c.statut === 'EN_PREPARATION' ? 'En préparation' : 'Reçue'}
                      </span>
                    </span>
                    <span className="dashboard-activity-time">{formatRelativeTime(c.creeLe)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Toast toast={toast} onClose={clearAlerte} />
    </>
  )
}
