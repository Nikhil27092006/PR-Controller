import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

export default function Unauthorized() {
  const { logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleLogin = () => {
    logout()
    navigate('/login', { state: { from: location }, replace: true })
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate(from, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-panel glass-strong text-center">
        <Link to="/" className="auth-logo" style={{ marginBottom: '2.5rem' }}>
          <div className="nav-logo-mark" style={{ width: 48, height: 48, borderRadius: 12 }}>
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="auth-logo-text">PRFlow Intelligence</span>
        </Link>

        <div style={{ marginBottom: '1.5rem' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="grad-blue-cyan" style={{ marginBottom: '1rem' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="auth-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          Access Denied
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
          You don&apos;t have permission to access this page. 
          Please sign in with an account that has access, or contact your administrator.
        </p>

        <div className="cta-actions" style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleLogin} className="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In with Different Account
          </button>
          <button onClick={handleGoBack} className="btn btn-ghost btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Go Back
          </button>
          <Link to={from} className="btn btn-outline-glow btn-lg" onClick={handleGoHome}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12" />
            </svg>
            Go to Dashboard
          </Link>
        </div>

        <p className="auth-footer-text" style={{ marginTop: '2rem', color: 'var(--text-40)' }}>
          <span className="mono" style={{ color: 'var(--text-20)' }}>PRFlow Intelligence</span> — Secure engineering workflow intelligence
        </p>
      </div>
    </div>
  )
}