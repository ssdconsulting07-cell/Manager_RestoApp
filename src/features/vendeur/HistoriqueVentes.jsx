import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { nombreArticles, totalEncaisseDuJourDe, ventesDuJourDe } from './ventesData.js'
import Recu from './Recu.jsx'
import './vendeur-pos.css'

function formatHeure(iso) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

// Historique propre au vendeur connecte (poste de caisse individuel, voir
// decision du 13/10/2026) — pas une vue globale de toutes les ventes du
// restaurant.
export default function HistoriqueVentes() {
  const { username } = useAuth()
  const [venteOuverte, setVenteOuverte] = useState(null)
  const ventes = ventesDuJourDe(username)
  const totalDuJour = totalEncaisseDuJourDe(username)

  return (
    <Layout>
      <div className="vendeur-historique-head">
        <div>
          <p className="manager-eyebrow">Vendeur</p>
          <h1>Historique de mes ventes</h1>
          <p>Vos tickets encaissés aujourd’hui.</p>
        </div>
        <Link className="manager-button manager-button-primary" to="/vente">
          Nouvelle vente →
        </Link>
      </div>

      <div className="vendeur-historique-stats">
        <div className="vendeur-historique-stat">
          <span>Ventes aujourd’hui</span>
          <strong>{ventes.length}</strong>
        </div>
        <div className="vendeur-historique-stat">
          <span>Total encaissé</span>
          <strong>{formatFCFA(totalDuJour)}</strong>
        </div>
      </div>

      {ventes.length === 0 ? (
        <div className="vendeur-pos-empty">Aucune vente encaissée pour l’instant aujourd’hui.</div>
      ) : (
        <ul className="vendeur-historique-liste">
          {ventes.map((vente) => (
            <li key={vente.id}>
              <button type="button" className="vendeur-historique-ligne" onClick={() => setVenteOuverte(vente)}>
                <span className="vendeur-historique-numero">Ticket n° {vente.numero}</span>
                <span className="vendeur-historique-heure">{formatHeure(vente.createdAt)}</span>
                <span className="vendeur-historique-articles">{nombreArticles(vente)} article{nombreArticles(vente) > 1 ? 's' : ''}</span>
                <span className="vendeur-historique-total">{formatFCFA(vente.total)}</span>
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {venteOuverte && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setVenteOuverte(null)}>
          <section className="manager-modal" role="dialog" aria-modal="true" aria-label={`Reçu du ticket n° ${venteOuverte.numero}`}>
            <Recu vente={venteOuverte} vendeurLabel={username || 'Vendeur'} onFermer={() => setVenteOuverte(null)} />
          </section>
        </div>
      )}
    </Layout>
  )
}
