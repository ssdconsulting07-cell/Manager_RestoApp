const VARIANTS = {
  ACTIF: 'is-actif',
  BROUILLON: 'is-brouillon',
  ARCHIVE: 'is-archive',
}

export default function StatusBadge({ statut, label }) {
  return <span className={`crud-status-badge ${VARIANTS[statut] || ''}`}>{label}</span>
}
