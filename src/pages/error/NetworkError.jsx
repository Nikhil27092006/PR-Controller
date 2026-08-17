import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NetworkError() {
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // When online, automatically redirect back to home page
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isOnline, navigate])

  const checkConnection = async () => {
    setChecking(true)
    try {
      await fetch('/', { method: 'HEAD', cache: 'no-cache' })
      setIsOnline(true)
      navigate(-1)
    } catch {
      setIsOnline(false)
    } finally {
      setChecking(false)
    }
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
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isOnline ? 'grad-blue-cyan' : 'grad-amber'} style={{ marginBottom: '1rem' }}>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.59 16.25A16 16 0 0 1 16.89 21" />
          </svg>
        </div>

        <h1 className="auth-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.75rem' }}>
          {isOnline ? 'Connection Restored' : 'Connection Lost'}
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
          {isOnline 
            ? 'You&apos;re back online. Redirecting...'
            : 'Unable to reach the server. Please check your internet connection and try again.'
          }
        </p>

        {!isOnline && (
          <div className="cta-actions" style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={checkConnection} 
              disabled={checking}
              className="btn btn-primary btn-lg"
            >
              {checking ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-spin" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Retry Connection
                </>
              )}
            </button>
            <Link to="/" className="btn btn-ghost btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12" />
              </svg>
              Back to Home
            </Link>
          </div>
        )}

        {isOnline && (
          <div style={{ marginTop: '1rem', color: 'var(--emerald-400)', fontSize: '0.8125rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Redirecting automatically...
          </div>
        )}

        <p className="auth-footer-text" style={{ marginTop: '2rem', color: 'var(--text-40)' }}>
          <span className="mono" style={{ color: 'var(--text-20)' }}>PRFlow Intelligence</span> — Engineering workflow intelligence
        </p>
      </div>
    </div>
  )
}