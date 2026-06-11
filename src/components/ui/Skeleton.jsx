import './Skeleton.css'

export function Skeleton({ width, height = '16px', borderRadius = '4px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width="40%" height="12px" />
      <Skeleton width="70%" height="28px" className="mt-8" />
      <Skeleton width="50%" height="10px" className="mt-8" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  )
}
