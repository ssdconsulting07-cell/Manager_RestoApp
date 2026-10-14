import { useMemo } from 'react'
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useAuth } from '../../auth/AuthContext.jsx'
import {
  ChartTooltip, KpiCard, formatFCFA, formatRelativeTime,
} from '../../components/dashboard/DashboardWidgets.jsx'
import {
  nombreArticles, totalEncaisseDuJourDe, ventesDe, ventesDuJourDe,
} from './ventesData.js'

// Tableau de bord Vendeur/Caissier — meme structure et memes briques que les
// tableaux de bord Gerant et Manager (cartes KPI, panneau graphique, flux
// d'activite recent), rendu par le tableau de bord generique (voir
// dashboard/Dashboard.jsx) plutot que dans son propre Layout.
const NOUVELLE_VENTE = '/vente'
const HISTORIQUE = '/historique-ventes'
// Le flux "Derniers tickets" n'est qu'un apercu de l'historique complet.
const APERCU_TICKETS = 8

function heureTicket(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function VendeurDashboard() {
  const { username } = useAuth()

  const ventesDuJour = useMemo(() => ventesDuJourDe(username), [username])
  const totalDuJour = useMemo(() => totalEncaisseDuJourDe(username), [username])
  const dernierTicket = ventesDuJour[0]
  const panierMoyen = ventesDuJour.length ? Math.round(totalDuJour / ventesDuJour.length) : 0

  // Chronologique (le plus ancien d'abord) pour lire le graphique de gauche a
  // droite comme une journee qui avance.
  const graphiqueDuJour = useMemo(
    () => [...ventesDuJour].reverse().map((v) => ({ heure: heureTicket(v.createdAt), montant: v.total })),
    [ventesDuJour],
  )

  const derniersTickets = useMemo(() => ventesDe(username).slice(0, APERCU_TICKETS), [username])

  return (
    <>
      <section className="dashboard-section" aria-labelledby="vendeur-caisse-titre">
        <div className="dashboard-section-heading">
          <p className="manager-eyebrow">Caisse</p>
          <h2 id="vendeur-caisse-titre">Ventes du jour</h2>
        </div>

        <div className="dashboard-kpi-grid is-wrapping">
          <KpiCard
            icon="fa-cart-shopping" accent="brand" label="Ventes aujourd’hui"
            value={ventesDuJour.length} detail="tickets encaissés" to={NOUVELLE_VENTE}
          />
          <KpiCard
            icon="fa-sack-dollar" accent="amber" label="Total encaissé"
            value={formatFCFA(totalDuJour)} detail="aujourd’hui" to={HISTORIQUE}
          />
          <KpiCard
            icon="fa-basket-shopping" accent="gray" label="Panier moyen"
            value={formatFCFA(panierMoyen)} detail="par vente" to={HISTORIQUE}
          />
          <KpiCard
            icon="fa-receipt" accent="green" label="Dernier ticket"
            value={dernierTicket ? `N° ${dernierTicket.numero}` : '—'}
            detail={dernierTicket ? formatFCFA(dernierTicket.total) : 'Aucune vente pour l’instant'}
            to={HISTORIQUE}
          />
        </div>

        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="manager-eyebrow">Évolution</p>
              <h2>Ventes encaissées aujourd’hui</h2>
            </div>
          </div>
          {graphiqueDuJour.length === 0 ? (
            <p className="dashboard-chart-empty">Aucune vente encaissée pour l’instant — ouvrez la caisse pour démarrer.</p>
          ) : (
            <ResponsiveContainer width="100%" height={248}>
              <BarChart data={graphiqueDuJour} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="heure" interval={0} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} />
                <YAxis width={44} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatValue={formatFCFA} />} cursor={{ fill: 'var(--chart-cursor)' }} />
                <Bar dataKey="montant" name="Vente" fill="var(--chart-brand)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="dashboard-panel dashboard-activity-panel" aria-labelledby="vendeur-tickets-titre">
        <div className="dashboard-panel-heading">
          <div>
            <p className="manager-eyebrow">Historique</p>
            <h2 id="vendeur-tickets-titre">Derniers tickets</h2>
          </div>
        </div>

        {derniersTickets.length === 0 ? (
          <p className="dashboard-chart-empty">Aucun ticket encaissé pour l’instant.</p>
        ) : (
          <ul className="dashboard-activity-list">
            {derniersTickets.map((vente) => {
              const articles = nombreArticles(vente)
              return (
                <li key={vente.id}>
                  <div className="dashboard-activity-row is-static is-wrapping">
                    <span className="dashboard-activity-icon" aria-hidden="true"><i className="fa-solid fa-receipt" /></span>
                    <span className="dashboard-activity-text">
                      <strong>Ticket n° {vente.numero} — {formatFCFA(vente.total)}</strong>
                      <span>{articles} article{articles > 1 ? 's' : ''}</span>
                    </span>
                    <time className="dashboard-activity-time" dateTime={vente.createdAt}>{formatRelativeTime(vente.createdAt)}</time>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
