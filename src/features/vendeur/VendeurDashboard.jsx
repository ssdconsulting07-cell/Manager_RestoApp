import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { totalEncaisseDuJourDe, ventesDuJourDe } from './ventesData.js'
import './vendeur-dashboard.css'

// Tableau de bord Vendeur/Caissier : repere rapide avant d'ouvrir la caisse,
// meme esprit que CuisineDashboard.jsx (son propre Layout, pas de dependance
// au tableau de bord generique des autres roles).
export default function VendeurDashboard() {
  const { username } = useAuth()
  const ventesDuJour = ventesDuJourDe(username)
  const totalDuJour = totalEncaisseDuJourDe(username)
  const dernierTicket = ventesDuJour[0]

  return (
    <Layout>
      <section className="vendeur-dash">
        <header className="vendeur-dash-hero">
          <div className="vendeur-dash-hero-copy">
            <p className="manager-eyebrow">Poste de caisse</p>
            <h1>Bonjour, {username || 'équipe Vendeur'}.</h1>
            <p>
              {ventesDuJour.length > 0
                ? `${ventesDuJour.length} vente${ventesDuJour.length > 1 ? 's' : ''} encaissée${ventesDuJour.length > 1 ? 's' : ''} aujourd’hui, pour ${formatFCFA(totalDuJour)}.`
                : 'Aucune vente encaissée pour l’instant — ouvrez la caisse pour démarrer.'}
            </p>
            <div className="vendeur-dash-hero-actions">
              <Link className="manager-button manager-button-primary" to="/vente">
                Nouvelle vente →
              </Link>
              <span className="dashboard-role-badge">Vendeur</span>
            </div>
          </div>
          <div className="vendeur-dash-hero-visual" aria-hidden="true">
            <i className="fa-solid fa-cash-register" />
          </div>
        </header>

        <section className="vendeur-dash-cards" aria-label="Résumé du jour">
          <Link to="/vente" className="vendeur-dash-card">
            <span className="vendeur-dash-card-icon" aria-hidden="true"><i className="fa-solid fa-cart-shopping" /></span>
            <span className="vendeur-dash-card-value"><strong>{ventesDuJour.length}</strong><span>Ventes aujourd’hui</span></span>
          </Link>
          <Link to="/historique-ventes" className="vendeur-dash-card">
            <span className="vendeur-dash-card-icon" aria-hidden="true"><i className="fa-solid fa-sack-dollar" /></span>
            <span className="vendeur-dash-card-value"><strong>{formatFCFA(totalDuJour)}</strong><span>Total encaissé</span></span>
          </Link>
          <Link to="/historique-ventes" className="vendeur-dash-card">
            <span className="vendeur-dash-card-icon" aria-hidden="true"><i className="fa-solid fa-receipt" /></span>
            <span className="vendeur-dash-card-value">
              <strong>{dernierTicket ? `N° ${dernierTicket.numero}` : '—'}</strong>
              <span>Dernier ticket</span>
            </span>
          </Link>
        </section>
      </section>
    </Layout>
  )
}
