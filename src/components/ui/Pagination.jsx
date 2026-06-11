import './Pagination.css'

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left = page - delta
  const right = page + delta + 1

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      pages.push(i)
    }
  }

  const withEllipsis = []
  let prev = null
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="pagination-wrapper">
      <span className="pagination-info">
        Exibindo {start}–{end} de {totalItems} registros
      </span>
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ‹
        </button>
        {withEllipsis.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  )
}
