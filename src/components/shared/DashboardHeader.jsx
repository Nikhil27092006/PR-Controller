import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

export default function DashboardHeader({ title, subtitle }) {
  const { repos, showToast } = useApp()
  const syncingRepos = repos.filter(r => r.status === 'syncing')
  const isSyncing = syncingRepos.length > 0

  const handleManualSync = () => {
    showToast('Manual organizational sync triggered...', 'info')
    // Trigger mock syncs on repos that are connected
    repos.forEach(repo => {
      if (repo.connected && repo.status !== 'syncing') {
        // Trigger context connection
      }
    })
  }

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-title-area">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {/* Sync Status Badge / Button */}
        <button 
          onClick={handleManualSync} 
          className={`btn-sync glass ${isSyncing ? 'is-syncing' : ''}`}
          disabled={isSyncing}
          aria-label="Synchronize database"
        >
          <svg className="icon-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isSyncing ? 'Syncing GitHub...' : 'Sync Now'}</span>
        </button>

        {/* Global Search Bar */}
        <div className="header-search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="search" 
            placeholder="Search PRs, branches, authors..." 
            className="header-search-input"
            aria-label="Search pull requests and code branches"
          />
        </div>

        {/* Quick Help / Docs link */}
        <Link to="/docs" className="header-icon-btn glass" title="Platform Documentation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
