import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

export default function DashboardHeader({ title, subtitle, onSearch }) {
  const { reposLoading, loadRepositories, showToast, alerts } = useApp()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const unreadAlerts = alerts.filter(a => !a.read).length

  const handleManualSync = async () => {
    showToast('Triggering full GitHub sync & triage...', 'info')
    try {
      await loadRepositories()
      showToast('GitHub repositories & PR data synchronized.', 'success')
    } catch (err) {
      showToast(err.message || 'Refresh failed', 'error')
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    } else if (query.trim()) {
      navigate(`/prs?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="dashboard-header" role="banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.75rem', gap: '1.25rem', flexWrap: 'wrap' }}>
      <div className="header-title-area">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle" style={{ marginTop: '0.2rem' }}>{subtitle}</p>}
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="header-search-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.75rem', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="search" 
            placeholder="Search PRs, branches, reviewers..." 
            className="header-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (onSearch) onSearch(e.target.value)
            }}
            aria-label="Search pull requests and code branches"
            style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem', width: 260 }}
          />
          <span style={{ position: 'absolute', right: '0.5rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            ⌘K
          </span>
        </form>

        {/* Sync Status Badge / Button */}
        <button 
          onClick={handleManualSync} 
          className={`btn-sync glass ${reposLoading ? 'is-syncing' : ''}`}
          disabled={reposLoading}
          aria-label="Synchronize database"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.85rem' }}
        >
          <svg className={reposLoading ? 'icon-spin' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{reposLoading ? 'Syncing...' : 'Sync GitHub'}</span>
        </button>

        {/* Alerts Bell */}
        <Link
          to="/alerts"
          className="header-icon-btn glass"
          title="Incident Alerts"
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: unreadAlerts > 0 ? 'var(--cyan-400)' : 'rgba(255,255,255,0.5)',
            textDecoration: 'none'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadAlerts > 0 && (
            <span style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#f87171',
              boxShadow: '0 0 8px #f87171'
            }} />
          )}
        </Link>

        {/* Quick Help / Docs link */}
        <Link
          to="/docs"
          className="header-icon-btn glass"
          title="Platform Documentation"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </Link>
      </div>
    </header>
  )
}

