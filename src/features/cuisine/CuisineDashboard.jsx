import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Toast from '../../components/Toast.jsx'
import { KpiCard, formatRelativeTime } from '../../components/dashboard/DashboardWidgets.jsx'
import { comparerPriorite, estComptoir, resumePlats } from './cuisineUtils.js'
import { useAlerteNouvelleCommande } from './useAlerteNouvelleCommande.js'
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
  const { commandes, produits, loading, nouvelleAlerte, clearAlerte } = useCuisineBoard()

  // EN_LIVRAISON compte avec PRETE ici aussi (meme regle que Commandes.jsx,
  // voir son commentaire sur counts/filtrees) : sans ça, la carte KPI
  // "Prêtes" du tableau de bord afficherait un nombre different de la
  // carte-filtre "Prêtes" de l'ecran Commandes pour les memes commandes
  // (releve agent local).
  const counts = useMemo(() => {
    const c = { PAYEE: 0, EN_PREPARATION: 0, PRETE: 0 }
    for (const commande of commandes) {
      const cle = commande.statut === 'EN_LIVRAISON' ? 'PRETE' : commande.statut
      if (c[cle] !== undefined) c[cle] += 1
    }
    return c
  }, [commandes])

  // Repartition App / Sur place sur le meme perimetre que "Commandes
  // actives" (les 4 statuts suivis par useCuisineBoard) : app + comptoir
  // egale toujours ce total.
  const canalCounts = useMemo(() => {
    const c = { app: 0, comptoir: 0 }
    for (const commande of commandes) {
      if (estComptoir(commande)) c.comptoir += 1
      else c.app += 1
    }
    return c
  }, [commandes])

  // Meme ordre de priorite que l'ecran Commandes (voir comparerPriorite).
  const apercu = useMemo(
    () =>
      commandes
        .filter((c) => c.statut === 'PAYEE' || c.statut === 'EN_PREPARATION')
        .sort(comparerPriorite)
        .slice(0, APERCU_TICKETS),
    [commandes],
  )

  // Meme bip + toast que Commandes.jsx, via le hook partage (retour
  // relecture : la cuisine arrive sur ce tableau de bord apres connexion —
  // voir ROLE_HOME dans roles.js — donc un poste qui y reste doit lui aussi
  // entendre les nouvelles commandes, pas seulement le tableau filtrable).
  const toast = useAlerteNouvelleCommande(nouvelleAlerte)

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Résumé cuisine">
        <KpiCard
          icon="fa-layer-group" accent="brand" label="Commandes actives"
          value={loading ? '—' : counts.PAYEE + counts.EN_PREPARATION + counts.PRETE}
          detail="reçue → prête" to="/commandes"
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
        <KpiCard
          icon="fa-mobile-screen-button" accent="blue" label="App"
          value={loading ? '—' : canalCounts.app} detail="commandes à distance" to="/commandes"
        />
        <KpiCard
          icon="fa-store" accent="gray" label="Sur place"
          value={loading ? '—' : canalCounts.comptoir} detail="au comptoir" to="/commandes"
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
            {apercu.map((c) => (
              <li key={c.id}>
                <Link className="dashboard-activity-row" to="/commandes">
                  <span className="dashboard-activity-icon" aria-hidden="true">
                    <i className={`fa-solid ${c.statut === 'EN_PREPARATION' ? 'fa-fire-burner' : 'fa-receipt'}`} />
                  </span>
                  <span className="dashboard-activity-text">
                    <strong>#{String(c.id).replace(/^demo-/, '')}</strong>
                    <span>
                      {resumePlats(c.lignes, produits)}
                      {' · '}
                      {c.statut === 'EN_PREPARATION' ? 'En préparation' : 'Reçue'}
                    </span>
                  </span>
                  <span className="dashboard-activity-time">{formatRelativeTime(c.creeLe)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Toast toast={toast} onClose={clearAlerte} />
    </>
  )
}
