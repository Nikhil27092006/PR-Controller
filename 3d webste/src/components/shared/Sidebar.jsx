import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

// Icon paths for premium design
const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  prs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4 8 0 0 0-8 0v4" />
      <path d="M15 2a4 8 0 0 0-8 0v4" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="6" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="18" />
    </svg>
  ),
  dependencies: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M12 8v8M12 16h-4M12 16h4" strokeDasharray="3 3" />
    </svg>
  ),
  reviewers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  repositories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  alerts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export default function Sidebar() {
  const { user, logout, alerts, repos, selectedRepoId, setSelectedRepoId } = useApp()
  const location = useLocation()
  
  const unreadAlerts = alerts.filter(a => !a.read).length
  const connectedRepos = repos.filter(r => r.connected)

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { path: '/prs', label: 'Pull Requests', icon: ICONS.prs },
    { path: '/dependencies', label: 'Dependency Graph', icon: ICONS.dependencies },
    { path: '/reviewers', label: 'Reviewers', icon: ICONS.reviewers },
    { path: '/analytics', label: 'Analytics', icon: ICONS.analytics },
    { path: '/repositories', label: 'Repositories', icon: ICONS.repositories },
    { path: '/alerts', label: 'Alerts', icon: ICONS.alerts, badge: unreadAlerts },
    { path: '/settings', label: 'Settings', icon: ICONS.settings },
  ]

  return (
    <aside className="sidebar glass" role="navigation" aria-label="Application sidebar">
      <div className="sidebar-brand" style={{ marginBottom: '1.25rem' }}>
        <Link to="/" className="sidebar-logo">
          <div className="nav-logo-mark">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
              <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span>PRFlow</span>
        </Link>
      </div>

      {/* Global Repo Selector Dropdown */}
      <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <label htmlFor="sidebar-repo-select" style={{ display: 'block', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-40)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
          Active Repository
        </label>
        <div style={{ position: 'relative' }}>
          <select
            id="sidebar-repo-select"
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(2,4,7,0.5)',
              border: '1px solid var(--border-8)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 2rem 0.45rem 0.75rem',
              color: '#fff',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)%25' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.625rem center',
              backgroundSize: '0.75rem',
            }}
          >
            <option value="all">All Connected Repos</option>
            {connectedRepos.map(r => (
              <option key={r.id} value={r.id}>
                {r.owner}/{r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          return (
            <li key={item.path}>
              <Link to={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="sidebar-link-badge">{item.badge}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {user && (
        <div className="sidebar-user glass-md">
          <Link to="/profile" className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user.avatar}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </Link>
          <button 
            onClick={logout} 
            className="sidebar-logout" 
            title="Log Out"
            aria-label="Logout from app"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  )
}
