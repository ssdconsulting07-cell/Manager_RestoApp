import { Link } from 'react-router-dom'

// Briques partagees des tableaux de bord (Gerant, Manager) : memes cartes KPI,
// meme infobulle de graphique, memes formats, pour qu'on ne sente aucune
// rupture de style en passant d'un espace a l'autre.

export function formatRelativeTime(timestamp) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'à l’instant'
  if (elapsedMinutes < 60) return `il y a ${elapsedMinutes} min`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `il y a ${elapsedHours} h`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return elapsedDays === 1 ? 'hier' : `il y a ${elapsedDays} jours`
}

export function formatFCFA(montant) {
  return `${montant.toLocaleString('fr-FR')} F CFA`
}

export function KpiCard({ icon, accent, label, value, detail, to }) {
  return (
    <Link className={`dashboard-kpi-card is-${accent}`} to={to}>
      <span className="dashboard-kpi-icon" aria-hidden="true"><i className={`fa-solid ${icon}`} /></span>
      <span className="dashboard-kpi-body">
        <strong>{value}</strong>
        <span className="dashboard-kpi-label">{label}</span>
        {detail && <span className="dashboard-kpi-detail">{detail}</span>}
      </span>
      <span className="dashboard-kpi-arrow" aria-hidden="true">→</span>
    </Link>
  )
}

export function ChartTooltip({ active, payload, formatValue = (value) => value }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-chart-tooltip">
      {payload.map((entry) => (
        <div className="dashboard-chart-tooltip-row" key={entry.name || entry.dataKey}>
          <span className="dashboard-chart-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
          {entry.name} : <strong>{formatValue(entry.value)}</strong>
        </div>
      ))}
    </div>
  )
}
