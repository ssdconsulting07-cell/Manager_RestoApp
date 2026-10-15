export default function StatFilterCards({ items, selected, onSelect, ariaLabel = 'Filtrer par statut', className = '', toggleable = false }) {
  return (
    <div className={`crud-filter-grid ${className}`} role={toggleable ? 'group' : 'tablist'} aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role={toggleable ? undefined : 'tab'}
          aria-selected={toggleable ? undefined : selected === item.key}
          aria-pressed={toggleable ? selected === item.key : undefined}
          className={`crud-filter-card ${selected === item.key ? 'is-selected' : ''}`}
          style={{ '--stat-accent': item.accent, '--stat-accent-bg': item.accentBg }}
          onClick={() => onSelect(item.key)}
        >
          <span className="crud-filter-icon" aria-hidden="true"><i className={`fa-solid ${item.icon}`} /></span>
          <strong>{item.value}</strong>
          <span className="crud-filter-label">{item.label}</span>
          {selected === item.key && <span className="crud-filter-selected" aria-hidden={toggleable ? 'true' : undefined}>Sélectionné</span>}
        </button>
      ))}
    </div>
  )
}
