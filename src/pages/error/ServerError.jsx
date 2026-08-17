import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ServerError() {
  const navigate = useNavigate()

  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    navigate('/', { replace: true })
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
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="grad-amber" style={{ marginBottom: '1rem', animation: 'pulse 2s ease-in-out infinite' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.02); }
            }
          `}</style>
        </div>

        <h1 className="auth-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          Something Went Wrong
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
          We encountered an unexpected error. Our team has been notified and is working on a fix. 
          Please try again in a moment.
        </p>

        <div className="cta-actions" style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleRetry} className="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
          <Link to="/" className="btn btn-ghost btn-lg" onClick={handleGoHome}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12" />
            </svg>
            Back to Home
          </Link>
          <Link to="/contact" className="btn btn-outline-glow btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Contact Support
          </Link>
        </div>

        <details style={{ marginTop: '2rem', textAlign: 'left', color: 'var(--text-40)', fontSize: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-60)', marginBottom: '0.5rem' }}>
            Technical Details
          </summary>
          <div className="glass-md" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', overflow: 'auto', maxHeight: '200px' }}>
            <div>Error Boundary Caught</div>
            <div style={{ color: 'var(--text-20)', marginTop: '0.5rem' }}>
              This error was caught by the React error boundary. 
              The error details have been logged to the console.
            </div>
          </div>
        </details>

        <p className="auth-footer-text" style={{ marginTop: '2rem', color: 'var(--text-40)' }}>
          <span className="mono" style={{ color: 'var(--text-20)' }}>PRFlow Intelligence</span> — Engineering workflow intelligence
        </p>
      </div>
    </div>
  )
}