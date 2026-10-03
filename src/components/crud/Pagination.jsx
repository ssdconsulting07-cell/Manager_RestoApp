function getPageItems(page, pageCount) {
  if (pageCount <= 1) return [1]
  const items = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) items.push('ellipsis-start')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < pageCount - 1) items.push('ellipsis-end')
  items.push(pageCount)
  return items
}

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
  const safePageCount = Math.max(1, pageCount)
  const pageItems = getPageItems(page, safePageCount)

  return (
    <div className="crud-pagination">
      <div className="crud-pagination-summary">
        {totalItems === 0 ? 'Aucun résultat' : `${from}–${to} sur ${totalItems}`}
      </div>

      <nav className="crud-pagination-controls" aria-label="Pagination">
        <button
          type="button"
          className="crud-pagination-nav"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Première page"
        >
          <i className="fa-solid fa-angles-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="crud-pagination-nav"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>

        <div className="crud-pagination-pages">
          {pageItems.map((item) => (
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                className={`crud-pagination-pagebtn ${item === page ? 'is-active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="crud-pagination-ellipsis" aria-hidden="true">…</span>
            )
          ))}
        </div>

        <button
          type="button"
          className="crud-pagination-nav"
          disabled={page >= safePageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="crud-pagination-nav"
          disabled={page >= safePageCount}
          onClick={() => onPageChange(safePageCount)}
          aria-label="Dernière page"
        >
          <i className="fa-solid fa-angles-right" aria-hidden="true" />
        </button>
      </nav>

      <div className="crud-pagination-rows">
        <span>Lignes</span>
        <div
          className="crud-rows-toggle"
          role="group"
          aria-label="Lignes par page"
          style={{ '--active-index': Math.max(0, rowsOptions.indexOf(rowsPerPage)) }}
        >
          <span className="crud-rows-thumb" aria-hidden="true" />
          {rowsOptions.map((n) => (
            <button
              key={n}
              type="button"
              className={`crud-rows-option ${rowsPerPage === n ? 'is-active' : ''}`}
              onClick={() => onRowsPerPageChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
