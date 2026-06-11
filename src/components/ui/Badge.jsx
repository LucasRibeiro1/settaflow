import './Badge.css'

export function Badge({ type = 'default', children, size = 'md' }) {
  return (
    <span className={`badge badge-${type} badge-${size}`}>
      {children}
    </span>
  )
}
