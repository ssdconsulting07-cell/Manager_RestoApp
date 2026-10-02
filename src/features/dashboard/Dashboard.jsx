import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLE_LABELS } from '../../auth/roles.js'
import Layout from '../../components/Layout.jsx'
import GerantDashboard from '../gerant/GerantDashboard.jsx'

const DASHBOARD_DATA = {
  CUISINE: {
    eyebrow: 'Service en cours',
    title: 'Bonjour, équipe Cuisine.',
    description: 'Gardez le rythme sur les commandes qui attendent votre attention.',
    cards: [
      ['Commandes à préparer', '0', 'En attente de traitement', '/commandes'],
      ['En préparation', '0', 'Commandes en cours', '/commandes'],
      ['Prêtes à servir', '0', 'À remettre au client ou au livreur', '/commandes'],
    ],
    action: ['Voir les commandes', '/commandes'],
  },
  GERANT: {
    eyebrow: 'Gérance',
    title: 'Tableau de bord',
    description: 'Vue d’ensemble du menu : statuts, disponibilité, catégories et annonces, en un coup d’œil.',
  },
  MANAGER: {
    eyebrow: 'Vue opérationnelle',
    title: 'Bonjour, équipe Manager.',
    description: 'Suivez les indicateurs essentiels et les équipes du restaurant.',
    cards: [
      ['Chiffre du jour', '—', 'Données bientôt disponibles', '/statistiques'],
      ['Commandes du jour', '0', 'Toutes les commandes', '/commandes'],
      ['Équipe active', '0', 'Collaborateurs connectés', '/personnel'],
    ],
    action: ['Ouvrir les statistiques', '/statistiques'],
  },
  LIVREUR: {
    eyebrow: 'Tournées du jour',
    title: 'Bonjour, équipe Livraison.',
    description: 'Retrouvez les commandes à prendre en charge et leur progression.',
    cards: [
      ['À récupérer', '0', 'Commandes prêtes', '/livraisons'],
      ['En livraison', '0', 'Tournées en cours', '/livraisons'],
      ['Livrées aujourd’hui', '0', 'Courses terminées', '/livraisons'],
    ],
    action: ['Voir les livraisons', '/livraisons'],
  },
}

export default function Dashboard() {
  const { role } = useAuth()
  const data = DASHBOARD_DATA[role] || DASHBOARD_DATA.CUISINE

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">{data.eyebrow}</p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
        <span className="dashboard-role-badge">{ROLE_LABELS[role]}</span>
      </section>

      {role === 'GERANT' ? (
        <GerantDashboard />
      ) : (
        <>
          <section className="dashboard-stat-grid" aria-label="Résumé de l’activité">
            {data.cards.map(([label, value, detail, path]) => (
              <Link className="dashboard-stat-card" key={label} to={path}>
                <div className="dashboard-stat-head">
                  <span className="dashboard-stat-label">{label}</span>
                </div>
                <div className="dashboard-stat-body">
                  <strong>{value}</strong>
                  <span className="dashboard-stat-detail">{detail}</span>
                </div>
                <span className="dashboard-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </section>

          <section className="dashboard-lower-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <p className="manager-eyebrow">Raccourci</p>
                  <h2>Votre prochaine action</h2>
                </div>
              </div>
              <p className="dashboard-panel-copy">Accédez directement à l’espace principal de votre rôle.</p>
              <Link className="manager-button manager-button-primary dashboard-action" to={data.action[1]}>{data.action[0]} <span>→</span></Link>
            </div>
            <div className="dashboard-panel dashboard-panel-muted">
              <p className="manager-eyebrow">État du service</p>
              <h2>Tout est prêt pour commencer.</h2>
              <p className="dashboard-panel-copy">Les données opérationnelles apparaîtront ici dès les premières commandes.</p>
            </div>
          </section>
        </>
      )}
    </Layout>
  )
}
