import { useMemo } from 'react'
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ROLE_LABELS } from '../../auth/roles.js'
import {
  ChartTooltip, KpiCard, formatFCFA, formatRelativeTime,
} from '../../components/dashboard/DashboardWidgets.jsx'
import {
  STATUTS_COMMANDE, commandesDuJour, commandesEncaissees, countByStatutCommande,
} from './commandesData.js'
import {
  caDeLaSemaine, caDuJour, caDuMois, caSeptDerniersJours,
} from './financeData.js'
import { DOMAINES_AUDIT, journalAudit } from './auditData.js'

// Tableau de bord Manager — meme structure et memes briques que le tableau de
// bord Gerant (cartes KPI, panneaux, graphiques recharts, flux d'activite).
// Commandes, paiements et audit n'existent pas encore cote Backend : tout vient
// des mocks en memoire de ce dossier. Le Manager n'a acces qu'a /dashboard et
// /journal-audit : les cartes menent donc toutes vers /journal-audit.
const JOURNAL_AUDIT = '/journal-audit'
// Le flux du tableau de bord n'est qu'un apercu du Journal d'audit.
const APERCU_AUDIT = 12

// Montant sur deux lignes au besoin : le nombre ne se coupe jamais (espaces
// insecables du format fr-FR) et l'unite passe a la ligne d'un seul bloc.
function Montant({ valeur }) {
  return <>{valeur.toLocaleString('fr-FR')} <span className="dashboard-kpi-unit">F&nbsp;CFA</span></>
}

function formatMontantAxe(valeur) {
  return valeur >= 1000 ? `${Math.round(valeur / 1000)} k` : String(valeur)
}

// Jour sur deux lignes (« ven » / « 2 ») : 7 libelles lisibles des 320px.
function JourTick({ x, y, payload }) {
  const [jour, numero] = payload.value.split(' ')
  return (
    <text x={x} y={y} textAnchor="middle" fill="var(--chart-axis)" fontSize={11}>
      <tspan x={x} dy="0.9em">{jour}</tspan>
      <tspan x={x} dy="1.25em">{numero}</tspan>
    </text>
  )
}

export default function ManagerDashboard() {
  const maintenant = new Date()

  const finances = useMemo(() => ({
    jour: caDuJour(),
    semaine: caDeLaSemaine(maintenant),
    mois: caDuMois(maintenant),
    septJours: caSeptDerniersJours(maintenant).map(({ date, estAujourdhui, montant }) => ({
      jour: `${estAujourdhui ? 'auj' : date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')} ${date.getDate()}`,
      montant,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  const commandes = useMemo(() => {
    const encaissees = commandesEncaissees(commandesDuJour)
    const total = encaissees.reduce((somme, c) => somme + c.montant, 0)
    return {
      total: commandesDuJour.length,
      encaissees: encaissees.length,
      counts: countByStatutCommande(commandesDuJour),
      panierMoyen: encaissees.length ? Math.round(total / encaissees.length) : 0,
    }
  }, [])

  const { counts } = commandes

  return (
    <>
      <section className="dashboard-section" aria-labelledby="manager-argent-titre">
        <div className="dashboard-section-heading">
          <p className="manager-eyebrow">Argent</p>
          <h2 id="manager-argent-titre">Chiffre d’affaires</h2>
        </div>

        <div className="dashboard-kpi-grid dashboard-kpi-grid-money is-wrapping">
          <KpiCard
            icon="fa-sack-dollar" accent="amber" label="CA du jour"
            value={<Montant valeur={finances.jour} />}
            detail={`${commandes.encaissees} commandes`} to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-calendar-week" accent="amber" label="CA de la semaine"
            value={<Montant valeur={finances.semaine} />} detail="depuis lundi" to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-calendar-days" accent="amber" label="CA du mois"
            value={<Montant valeur={finances.mois} />}
            detail={`depuis le 1er ${maintenant.toLocaleDateString('fr-FR', { month: 'short' })}`} to={JOURNAL_AUDIT}
          />
        </div>

        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="manager-eyebrow">Évolution</p>
              <h2>CA des 7 derniers jours</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={248}>
            <BarChart data={finances.septJours} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="jour" interval={0} height={40} tick={<JourTick />} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} />
              <YAxis width={44} tickFormatter={formatMontantAxe} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatValue={formatFCFA} />} cursor={{ fill: 'var(--chart-cursor)' }} />
              {/* --chart-brand (et non --chart-fill-orange) : meme teinte, mais >= 3:1 sur le fond du panneau dans les deux themes. */}
              <Bar dataKey="montant" name="Chiffre d’affaires" fill="var(--chart-brand)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="manager-commandes-titre">
        <div className="dashboard-section-heading">
          <p className="manager-eyebrow">Commandes</p>
          <h2 id="manager-commandes-titre">Commandes du jour</h2>
        </div>

        <div className="dashboard-kpi-grid is-wrapping">
          <KpiCard
            icon="fa-inbox" accent="brand" label="Reçues"
            value={counts[STATUTS_COMMANDE.PAYEE]} detail={`${commandes.total} au total`} to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-fire-burner" accent="amber" label="En préparation"
            value={counts[STATUTS_COMMANDE.EN_PREPARATION]} detail="en cuisine" to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-bell-concierge" accent="green" label="Prêtes"
            value={counts[STATUTS_COMMANDE.PRETE]} detail="à remettre ou livrer" to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-circle-check" accent="green" label="Livrées"
            value={counts[STATUTS_COMMANDE.LIVREE]} detail="remises aux clients" to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-ban" accent="red" label="Annulées aujourd’hui"
            value={counts[STATUTS_COMMANDE.ANNULEE]} detail="non encaissées" to={JOURNAL_AUDIT}
          />
          <KpiCard
            icon="fa-basket-shopping" accent="gray" label="Panier moyen"
            value={<Montant valeur={commandes.panierMoyen} />} detail="par commande" to={JOURNAL_AUDIT}
          />
        </div>
      </section>

      <section className="dashboard-panel dashboard-activity-panel" aria-labelledby="manager-audit-titre">
        <div className="dashboard-panel-heading">
          <div>
            <p className="manager-eyebrow">Journaux d’audit</p>
            <h2 id="manager-audit-titre">Actions du personnel</h2>
          </div>
        </div>

        {journalAudit.length === 0 ? (
          <p className="dashboard-chart-empty">Aucune action enregistrée pour le moment.</p>
        ) : (
          <ul className="dashboard-activity-list">
            {journalAudit.slice(0, APERCU_AUDIT).map((entree) => (
              <li key={entree.id}>
                <div className="dashboard-activity-row is-static is-wrapping">
                  <span className="dashboard-activity-icon" aria-hidden="true"><i className={`fa-solid ${DOMAINES_AUDIT[entree.domaine].icon}`} /></span>
                  <span className="dashboard-activity-text">
                    <strong>{entree.acteur.nom} {entree.action}</strong>
                    <span>{ROLE_LABELS[entree.acteur.role]} · {DOMAINES_AUDIT[entree.domaine].label}</span>
                  </span>
                  <time className="dashboard-activity-time" dateTime={entree.createdAt}>{formatRelativeTime(entree.createdAt)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
