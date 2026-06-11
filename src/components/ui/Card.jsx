import './Card.css'

export function Card({ children, className = '', padding = true, hoverable = false }) {
  return (
    <div className={`card ${hoverable ? 'card-hoverable' : ''} ${!padding ? 'card-no-pad' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  )
}
