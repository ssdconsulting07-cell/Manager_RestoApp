export default function StatFilterCards({ items, selected, onSelect, ariaLabel = 'Filtrer par statut', className = '' }) {
  return (
    <div className={`crud-filter-grid ${className}`} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={selected === item.key}
          className={`crud-filter-card ${selected === item.key ? 'is-selected' : ''}`}
          style={{ '--stat-accent': item.accent, '--stat-accent-bg': item.accentBg }}
          onClick={() => onSelect(item.key)}
        >
          <span className="crud-filter-icon" aria-hidden="true"><i className={`fa-solid ${item.icon}`} /></span>
          <strong>{item.value}</strong>
          <span className="crud-filter-label">{item.label}</span>
          {selected === item.key && <span className="crud-filter-selected">Sélectionné</span>}
        </button>
      ))}
    </div>
  )
}
