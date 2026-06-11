import { Link } from 'react-router-dom'
import './Breadcrumb.css'

export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="breadcrumb-item">
          {i < items.length - 1 ? (
            <>
              <Link to={item.to} className="breadcrumb-link">{item.label}</Link>
              <span className="breadcrumb-sep">›</span>
            </>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
