import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

const ICONS = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  prs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M6 9v6" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
      <polyline points="10 9 13 6 10 3" />
    </svg>
  ),
  dependencies: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <line x1="12" y1="7.5" x2="12" y2="12" />
      <line x1="12" y1="12" x2="6.5" y2="16.8" />
      <line x1="12" y1="12" x2="17.5" y2="16.8" />
    </svg>
  ),
  reviewers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  repositories: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  alerts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export default function Sidebar() {
  const { user, logout, alerts, repos, selectedRepoId, setSelectedRepoId } = useApp()
  const location = useLocation()

  const unreadAlerts = alerts.filter(a => !a.read).length

  const menuItems = [
    { path: '/dashboard', label: 'Command Center', icon: ICONS.dashboard },
    { path: '/prs', label: 'Pull Requests', icon: ICONS.prs },
    { path: '/dependencies', label: 'Dependency Graph', icon: ICONS.dependencies },
    { path: '/reviewers', label: 'Reviewer Radar', icon: ICONS.reviewers },
    { path: '/analytics', label: 'Velocity Analytics', icon: ICONS.analytics },
    { path: '/repositories', label: 'Repositories', icon: ICONS.repositories, badge: repos.length ? `${repos.length}` : null, badgeColor: 'rgba(59,130,246,0.3)' },
    { path: '/alerts', label: 'Incident Alerts', icon: ICONS.alerts, badge: unreadAlerts > 0 ? unreadAlerts : null },
    { path: '/settings', label: 'System Settings', icon: ICONS.settings },
  ]

  return (
    <aside className="sidebar" role="navigation" aria-label="Application sidebar">

      {/* ── Brand ─── */}
      <div style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
        <Link to="/" className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div className="nav-logo-mark">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>PRFlow</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(34,211,238,0.15)', color: 'var(--cyan-400)', border: '1px solid rgba(34,211,238,0.3)', letterSpacing: '0.05em' }}>PRO</span>
            </div>
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em', marginTop: '-2px' }}>AI Orchestrator</div>
          </div>
        </Link>
      </div>

      {/* ── Active Repo Context Card ─── */}
      <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <label
            htmlFor="sidebar-repo-select"
            style={{
              fontSize: '0.5625rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Target Scope
          </label>
          <span className="live-pulse-dot" title="Live GitHub Sync Active" />
        </div>
        <select
          id="sidebar-repo-select"
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          style={{
            width: '100%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '0.75rem',
            cursor: 'pointer',
            appearance: 'none',
            fontSize: '0.75rem',
            padding: '0.4rem 0.6rem',
          }}
        >
          <option value="all">All Connected Repos ({repos.length})</option>
          {repos.map(r => (
            <option key={r.id} value={r.id}>{r.owner}/{r.name}</option>
          ))}
        </select>
      </div>

      {/* ── Nav section label ─── */}
      <div style={{
        fontSize: '0.5625rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '0 0.75rem',
        marginBottom: '0.375rem',
      }}>
        Intelligence Suite
      </div>

      {/* ── Nav Items ─── */}
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge && (
                  <span
                    className="sidebar-link-badge"
                    style={item.badgeColor ? { background: item.badgeColor, color: '#93c5fd' } : {}}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* ── Quick Links Section ─── */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <div style={{
          fontSize: '0.5625rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '0 0.75rem',
          marginBottom: '0.375rem',
        }}>
          Resources
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', padding: '0 0.25rem', marginBottom: '0.875rem' }}>
          <Link
            to="/docs"
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6875rem',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Docs
          </Link>
          <Link
            to="/analysis-demo"
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6875rem',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Live Demo
          </Link>
        </div>


        {/* ── User Profile Badge ─── */}
        {user && (
          <div className="sidebar-user glass-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem' }}>
            <Link to="/profile" className="sidebar-user-info" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
              <div className="sidebar-user-avatar" style={{ position: 'relative' }}>
                {user.username.slice(0, 2).toUpperCase()}
                <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#34d399', border: '1.5px solid #060b18' }} />
              </div>
              <div className="sidebar-user-meta" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                <div className="sidebar-user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span>OAuth Verified</span>
                </div>
              </div>
            </Link>
            <button
              onClick={logout}
              className="sidebar-logout"
              title="Log Out"
              aria-label="Logout"
              style={{ padding: '0.35rem', cursor: 'pointer', background: 'transparent', border: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

