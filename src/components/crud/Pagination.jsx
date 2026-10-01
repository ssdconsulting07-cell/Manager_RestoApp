export default function Pagination({
  page,
  pageCount,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
  rowsOptions = [5, 10, 25],
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const to = Math.min(page * rowsPerPage, totalItems)

  return (
    <div className="crud-pagination">
      <div className="crud-pagination-rows">
        <label htmlFor="crud-rows-per-page">Lignes par page</label>
        <select
          id="crud-rows-per-page"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        >
          {rowsOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="crud-pagination-summary">
        {totalItems === 0 ? 'Aucun résultat' : `${from}–${to} sur ${totalItems}`}
      </div>
      <div className="crud-pagination-controls">
        <button
          type="button"
          className="manager-icon-button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <span className="crud-pagination-page">{page} / {Math.max(1, pageCount)}</span>
        <button
          type="button"
          className="manager-icon-button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
