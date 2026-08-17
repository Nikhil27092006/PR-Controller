import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useApp } from '../../store/AppContext'

/**
 * Landing page for the GitHub OAuth round-trip.
 *
 * The backend redirects here with either:
 *   - ?token=<jwt>&user_id=<id>  on success
 *   - ?error=<code>              on failure (e.g. access_denied, no_email)
 *
 * We re-use the same token storage and /auth/me hydration as the
 * password-based login, so AppContext.jsx does not need any changes.
 */
export default function GithubCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  // Use loginWithToken from the context rather than re-implementing
  // the same logic here. loginWithToken is the single owner of the
  // "store JWT, fetch /auth/me, set user state" sequence, and it
  // also fires the success toast. Reaching for a raw setUser
  // bypasses the context API the rest of the app uses.
  const { loginWithToken } = useApp()

  const [error, setError] = useState(null)
  // React 18 StrictMode runs effects twice in dev; guard against a
  // second token-exchanging pass.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const errParam = params.get('error')
    if (errParam) {
      let message = `GitHub authentication failed (${errParam}).`
      if (errParam === 'access_denied') {
        message = 'You cancelled the GitHub authorization. No changes were made.'
      } else if (errParam === 'no_email') {
        message = 'Your GitHub account does not expose a verified primary email. Please make one visible on GitHub or sign up with email and password.'
      } else if (errParam === 'profile_fetch_failed' || errParam === 'github_unavailable') {
        message = 'GitHub is currently experiencing temporary API delays (503 Service Unavailable). Please click Retry below.'
      } else if (errParam === 'token_exchange_failed') {
        message = 'Unable to complete the code exchange with GitHub. Please try signing in again.'
      } else if (errParam === 'bad_verification_code') {
        message = 'The authorization code has expired. Please sign in again.'
      }
      setError(message)
      return
    }

    const token = params.get('token')
    if (!token) {
      setError('Missing authentication token in callback URL.')
      return
    }

    loginWithToken(token).catch((err) => {
      console.error('GitHub callback /auth/me failed:', err)
      setError(
        (err && err.message)
          ? `Failed to load your account after GitHub sign-in: ${err.message}`
          : 'Failed to load your account after GitHub sign-in. Please try again.'
      )
    })
  }, [params, navigate, loginWithToken])

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-bg-orbs" aria-hidden="true">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>

        <div className="auth-panel glass-strong" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#f87171'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>
            GitHub Sign-In Notice
          </h1>
          <p className="auth-subtitle" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <a
              href="http://localhost:8000/auth/github/login"
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Retry GitHub Login
            </a>
            <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-panel glass-strong" style={{ textAlign: 'center' }}>
        <h1 className="auth-title" style={{ fontSize: '1.5rem' }}>
          Signing you in with GitHub…
        </h1>
        <p className="auth-subtitle">
          Just a moment while we finish setting up your session.
        </p>
      </div>
    </div>
  )
}
