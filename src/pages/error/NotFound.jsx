import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
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
          <span className="display-cta grad-blue-cyan" style={{ fontSize: 'clamp(6rem, 15vw, 12rem)', lineHeight: 1, display: 'block' }}>404</span>
        </div>

        <h1 className="auth-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back on track.
        </p>

        <div className="cta-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12" />
            </svg>
            Back to Home
          </Link>
          <Link to="/docs" className="btn btn-ghost btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            View Docs
          </Link>
        </div>

        <p className="auth-footer-text" style={{ marginTop: '2rem', color: 'var(--text-40)' }}>
          <span className="mono" style={{ color: 'var(--text-20)' }}>PRFlow Intelligence</span> — Engineering workflow intelligence
        </p>
      </div>
    </div>
  )
}