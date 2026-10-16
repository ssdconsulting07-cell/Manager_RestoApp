import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLE_LABELS } from '../../auth/roles.js'
import Layout from '../../components/Layout.jsx'
import CuisineDashboard from '../cuisine/CuisineDashboard.jsx'
import GerantDashboard from '../gerant/GerantDashboard.jsx'
import LivreurDashboard from '../livreur/LivreurDashboard.jsx'
import ManagerDashboard from '../manager/ManagerDashboard.jsx'
import VendeurDashboard from '../vendeur/VendeurDashboard.jsx'

// CUISINE et LIVREUR suivent desormais le meme patron generique que
// GERANT/MANAGER/VENDEUR (voir CuisineDashboard.jsx / LivreurDashboard.jsx) :
// plus de cas particulier ici.
const DASHBOARD_DATA = {
  CUISINE: {
    eyebrow: 'Service en cours',
    title: 'Tableau de bord',
    description: 'Commandes reçues, en préparation et prêtes : tout en un coup d’œil.',
  },
  GERANT: {
    eyebrow: 'Gérance',
    title: 'Tableau de bord',
    description: 'Menu, catégories et annonces : tout en un coup d’œil.',
  },
  MANAGER: {
    eyebrow: 'Vue opérationnelle',
    title: 'Tableau de bord',
    description: 'Chiffre d’affaires, commandes et actions du personnel : tout en un coup d’œil.',
  },
  LIVREUR: {
    eyebrow: 'Tournées du jour',
    title: 'Bonjour, équipe Livraison.',
    description: 'Retrouvez les commandes à prendre en charge et leur progression.',
  },
  VENDEUR: {
    eyebrow: 'Poste de caisse',
    title: 'Tableau de bord',
    description: 'Ventes du jour, total encaissé et derniers tickets : tout en un coup d’œil.',
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
      ) : role === 'MANAGER' ? (
        <ManagerDashboard />
      ) : role === 'VENDEUR' ? (
        <VendeurDashboard />
      ) : role === 'CUISINE' ? (
        <CuisineDashboard />
      ) : role === 'LIVREUR' ? (
        <LivreurDashboard />
      ) : null}
    </Layout>
  )
}
