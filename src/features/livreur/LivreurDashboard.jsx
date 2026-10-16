import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Toast from '../../components/Toast.jsx'
import { KpiCard, formatRelativeTime } from '../../components/dashboard/DashboardWidgets.jsx'
import { estAujourdhui, resumePlats, ticketId } from '../cuisine/cuisineUtils.js'
import { useAlerteNouvelleLivraison } from './useAlerteNouvelleLivraison.js'
import { useLivreurBoard } from './useLivreurBoard.js'

// Tableau de bord Livreur — meme structure et memes briques que les
// tableaux de bord Cuisine/Gerant/Manager/Vendeur (cartes KPI, flux
// d'activite recent), rendu par le tableau de bord generique (voir
// dashboard/Dashboard.jsx) plutot que dans son propre Layout. Reutilise
// useLivreurBoard (le meme hook que Livraisons.jsx) pour ne pas dupliquer
// la logique demo / comptage par statut.
const APERCU_LIVRAISONS = 6

export default function LivreurDashboard() {
  const { commandes, livrees, produits, loading, nouvelleAlerte, clearAlerte } = useLivreurBoard()

  const counts = useMemo(() => {
    const c = { PRETE: 0, EN_LIVRAISON: 0 }
    for (const commande of commandes) {
      if (c[commande.statut] !== undefined) c[commande.statut] += 1
    }
    return c
  }, [commandes])

  // Perimetre a part (livrees, pas commandes) : une fois scannee, une
  // commande sort de la liste active — voir Livraisons.jsx — donc ce
  // compte ne peut venir que de l'autre tableau que renvoie le hook.
  const livreesAujourdhui = useMemo(
    () => livrees.filter((c) => estAujourdhui(c.livreeLe)).length,
    [livrees],
  )

  // Les livraisons en cours d'abord (c'est ce qu'il y a a faire
  // maintenant), puis les plus anciennes "à récupérer" — meme ordre FIFO
  // que Livraisons.jsx au sein d'un meme statut.
  const apercu = useMemo(
    () =>
      commandes
        .filter((c) => c.statut === 'EN_LIVRAISON' || c.statut === 'PRETE')
        .sort((a, b) => {
          if (a.statut !== b.statut) return a.statut === 'EN_LIVRAISON' ? -1 : 1
          return new Date(a.creeLe) - new Date(b.creeLe)
        })
        .slice(0, APERCU_LIVRAISONS),
    [commandes],
  )

  const toast = useAlerteNouvelleLivraison(nouvelleAlerte)

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Résumé livraison">
        <KpiCard
          icon="fa-box-open" accent="amber" label="À récupérer"
          value={loading ? '—' : counts.PRETE} detail="commandes prêtes" to="/livraisons"
        />
        <KpiCard
          icon="fa-truck-fast" accent="brand" label="En livraison"
          value={loading ? '—' : counts.EN_LIVRAISON} detail="tournées en cours" to="/livraisons"
        />
        <KpiCard
          icon="fa-flag-checkered" accent="green" label="Livrées aujourd’hui"
          value={loading ? '—' : livreesAujourdhui} detail="courses terminées" to="/historique-livraisons"
        />
      </section>

      <section className="dashboard-panel dashboard-activity-panel" aria-labelledby="livreur-apercu-titre">
        <div className="dashboard-panel-heading">
          <div>
            <p className="manager-eyebrow">À prendre en charge</p>
            <h2 id="livreur-apercu-titre">Prochaines livraisons</h2>
          </div>
        </div>

        {apercu.length === 0 ? (
          <p className="dashboard-chart-empty">
            {loading ? 'Chargement…' : 'Aucune livraison à prendre en charge pour le moment.'}
          </p>
        ) : (
          <ul className="dashboard-activity-list">
            {apercu.map((c) => (
              <li key={c.id}>
                <Link className="dashboard-activity-row" to="/livraisons">
                  <span className="dashboard-activity-icon" aria-hidden="true">
                    <i className={`fa-solid ${c.statut === 'EN_LIVRAISON' ? 'fa-truck-fast' : 'fa-box-open'}`} />
                  </span>
                  <span className="dashboard-activity-text">
                    <strong>#{ticketId(c)}</strong>
                    <span>
                      {resumePlats(c.lignes, produits)}
                      {' · '}
                      {c.statut === 'EN_LIVRAISON' ? 'En livraison' : 'À récupérer'}
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
