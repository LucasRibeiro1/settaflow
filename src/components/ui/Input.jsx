import './Input.css'

export function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input className={`input ${icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''}`} {...props} />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <select className={`input select ${error ? 'input-error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea className={`input textarea ${error ? 'input-error' : ''}`} {...props} />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  )
}
