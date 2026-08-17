import React from 'react'
import { useNavigate } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    const navigate = this.props.navigate || (window.location.href = '/')
    if (typeof navigate === 'function') navigate('/', { replace: true })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="auth-page">
          <div className="auth-bg-orbs" aria-hidden="true">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
          </div>

          <div className="auth-panel glass-strong text-center">
            <a href="/" className="auth-logo" style={{ marginBottom: '2.5rem', display: 'inline-flex' }}>
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
            </a>

            <div style={{ marginBottom: '1.5rem' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="grad-amber" style={{ marginBottom: '1rem' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              fontWeight: 700, 
              letterSpacing: '-0.04em',
              color: 'var(--text-100)',
              marginBottom: '0.75rem'
            }}>
              Something Went Wrong
            </h1>
            <p style={{ 
              fontSize: '0.9375rem', 
              color: 'var(--text-60)', 
              lineHeight: 1.65,
              marginBottom: '2.5rem',
              maxWidth: '400px',
              margin: '0 auto 2.5rem'
            }}>
              We encountered an unexpected error. Our team has been notified. 
              Please try again in a moment.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={this.handleRetry} 
                className="btn btn-primary btn-lg"
                style={{ padding: '0.8125rem 2rem', fontSize: '0.9375rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>
              <button 
                onClick={this.handleGoHome} 
                className="btn btn-ghost btn-lg"
                style={{ padding: '0.8125rem 2rem', fontSize: '0.9375rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12" />
                </svg>
                Back to Home
              </button>
            </div>

            <details style={{ marginTop: '2rem', textAlign: 'left', color: 'var(--text-40)', fontSize: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-60)', marginBottom: '0.5rem' }}>
                Technical Details
              </summary>
              <div style={{ 
                background: 'rgba(8, 14, 28, 0.6)', 
                border: '1px solid var(--border-8)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '1rem', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.6875rem', 
                overflow: 'auto', 
                maxHeight: '200px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '0.5rem', color: 'var(--red-400)' }}>
                  {this.state.error && this.state.error.toString()}
                </div>
                <div style={{ color: 'var(--text-20)' }}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </div>
            </details>

            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-40)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-20)' }}>PRFlow Intelligence</span> — Engineering workflow intelligence
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate()
    return (
      <ErrorBoundary navigate={navigate}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}