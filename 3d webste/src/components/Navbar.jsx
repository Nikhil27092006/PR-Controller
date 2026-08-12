import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Logo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
    <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
    <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
    <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function Navbar({ scrolled }) {
  const location = useLocation()
  
  return (
    <nav className={`navbar ${scrolled || location.pathname !== '/' ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo" aria-label="PRFlow Intelligence home">
        <div className="nav-logo-mark"><Logo /></div>
        PRFlow Intelligence
      </Link>

      <ul className="nav-links" role="list">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/analysis-demo" className={location.pathname === '/analysis-demo' ? 'active' : ''}>
            Repo Analysis
          </Link>
        </li>
        <li>
          <Link to="/features" className={location.pathname === '/features' ? 'active' : ''}>
            Features
          </Link>
        </li>
        <li>
          <Link to="/docs" className={location.pathname === '/docs' ? 'active' : ''}>
            Documentation
          </Link>
        </li>
        <li>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
            Contact
          </Link>
        </li>
      </ul>

      <div className="nav-actions">
        <Link to="/login" className="btn btn-ghost">Sign in</Link>
        <Link to="/register" className="btn btn-primary" id="nav-request-demo">
          Try Free
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </nav>
  )
}
