import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-panel glass-strong" style={{ maxWidth: 420 }}>
        <Link to="/" className="auth-logo">
          <div className="nav-logo-mark" style={{ width: 40, height: 40, borderRadius: 10 }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="auth-logo-text">PRFlow Intelligence</span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
            <h2 className="auth-title">Check your inbox</h2>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>We've sent a reset link to <strong>{email}</strong>. It expires in 15 minutes.</p>
            <Link to="/login" className="btn btn-outline-glow btn-lg" style={{ display: 'inline-flex' }}>Back to Sign In</Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your email and we'll send a secure reset link</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-field">
                <label className="form-label" htmlFor="reset-email">Email Address</label>
                <input id="reset-email" type="email" placeholder="sarah@company.com" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
              Remember your password? <Link to="/login" className="auth-link">Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
