import React, { useState, useMemo } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import RepoInspectorModal from '../../components/shared/RepoInspectorModal'
import { AlertTriangleIcon, RepoIcon, SearchIcon } from '../../components/shared/Icons'
import { useApp } from '../../store/AppContext'


const PALETTE = ['#38bdf8', '#34d399', '#a855f7', '#fbbf24', '#f87171', '#60a5fa', '#22d3ee']

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function timeAgo(isoDate) {
  if (!isoDate) return 'Recently'
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export default function Repositories() {
  const { repos, reposLoading, addRepository, removeRepository, showToast, loadRepositories } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [newRepo, setNewRepo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Repository Inspector state
  const [inspectingRepo, setInspectingRepo] = useState(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)

  const handleOpenInspector = (repo) => {
    setInspectingRepo(repo)
    setIsInspectorOpen(true)
  }

  const handleCloseInspector = () => {
    setIsInspectorOpen(false)
    setInspectingRepo(null)
  }

  const handleAddRepo = async (e) => {
    e.preventDefault()
    setFormError('')

    const trimmed = newRepo.trim()
    const parts = trimmed.split('/')

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setFormError('Enter a repository as owner/name, e.g. facebook/react')
      return
    }

    setSubmitting(true)
    try {
      const created = await addRepository(parts[0], parts[1])
      setNewRepo('')
      setShowAdd(false)
      showToast(`Successfully linked ${trimmed}`, 'success')
      // Automatically open inspector for the newly added repo
      if (created) {
        handleOpenInspector(created)
      }
    } catch (err) {
      setFormError(err.message || 'Failed to add repository')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id, fullName) => {
    if (window.confirm(`Disconnect ${fullName} from PRFlow monitoring?`)) {
      try {
        await removeRepository(id)
        if (inspectingRepo?.id === id) {
          handleCloseInspector()
        }
        showToast(`Disconnected ${fullName}`, 'info')
      } catch (err) {
        // AppContext handles toast error
      }
    }
  }

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos
    const q = searchQuery.toLowerCase().trim()
    return repos.filter(
      r => r.name.toLowerCase().includes(q) ||
           r.owner.toLowerCase().includes(q) ||
           (r.description && r.description.toLowerCase().includes(q))
    )
  }, [repos, searchQuery])

  return (
    <div className="app-page">
      <DashboardHeader 
        title="Repositories" 
        subtitle="Manage connected GitHub repositories, inspect individual codebases, and review telemetry" 
      />

      <div className="page-content">

        {/* ── Top Counters ─── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(52,211,153,0.25)' }}>
            <h3 className="stat-card-title">Connected Repositories</h3>
            <div className="stat-card-value" style={{ color: '#34d399', marginTop: '0.35rem' }}>{repos.length}</div>
            <p className="stat-card-subtitle">Active Webhook Ingestion</p>
          </div>

          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(59,130,246,0.25)' }}>
            <h3 className="stat-card-title">Sync Status</h3>
            <div className="stat-card-value" style={{ color: '#60a5fa', marginTop: '0.35rem' }}>
              {reposLoading ? 'Synchronizing...' : 'Live Synced'}
            </div>
            <p className="stat-card-subtitle">Auto-polls GitHub every 60s</p>
          </div>

          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(34,211,238,0.25)' }}>
            <h3 className="stat-card-title">Inspection & Triage</h3>
            <div className="stat-card-value" style={{ color: 'var(--cyan-400)', marginTop: '0.35rem' }}>Individual Mode</div>
            <p className="stat-card-subtitle">Deep PR & Reviewer breakdown</p>
          </div>
        </div>

        {/* Header Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title">Connected GitHub Codebases</h2>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
              Inspect and review individual repositories for priority scoring, bottlenecks, and reviewer telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {repos.length > 0 && (
              <input
                type="text"
                placeholder="Search connected repos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8125rem',
                  color: '#fff',
                  width: 220
                }}
              />
            )}

            <button 
              onClick={() => setShowAdd(!showAdd)} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>+</span> Connect Repository
            </button>
          </div>
        </div>

        {/* ── Add Repository Form Card ─── */}
        {showAdd && (
          <form onSubmit={handleAddRepo} className="glass" style={{ borderRadius: 14, padding: '1.5rem', marginBottom: '1.25rem', borderColor: 'rgba(34,211,238,0.4)', background: 'linear-gradient(135deg, rgba(8,14,28,0.95) 0%, rgba(13,23,46,0.9) 100%)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Link GitHub Repository
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Enter the full repository slug (owner/repository-name). We will automatically pull open pull requests and configure triage webhooks.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  id="new-repo"
                  type="text"
                  placeholder="e.g. facebook/react or vercel/next.js"
                  value={newRepo}
                  onChange={e => setNewRepo(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.625rem 0.875rem', color: '#fff', fontSize: '0.875rem' }}
                  disabled={submitting}
                  autoFocus
                />
                {formError && (
                  <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangleIcon size={12} color="#f87171" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Connecting Codebase...' : 'Confirm Connection'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setFormError('') }} className="btn btn-ghost" disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Repositories Grid ─── */}
        {reposLoading && repos.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div>Syncing connected repositories...</div>
          </div>
        ) : repos.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <RepoIcon size={44} color="var(--cyan-400)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Repositories Linked
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
              Connect your first GitHub repository to start receiving automated priority scoring, dependency detection, and reviewer telemetry.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary">
              + Connect First Repository
            </button>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <SearchIcon size={36} color="rgba(255,255,255,0.4)" />
            </div>
            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              No repositories matched "{searchQuery}"
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>
              Try clearing your search query to see all connected repositories.
            </p>
          </div>
        ) : (

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredRepos.map((repo) => {
              const color = colorFor(repo.name)
              const fullName = `${repo.owner}/${repo.name}`
              return (
                <div
                  key={repo.id}
                  className="glass repo-card-item"
                  style={{
                    borderRadius: 14,
                    padding: '1.35rem 1.5rem',
                    borderColor: `${color}35`,
                    background: `linear-gradient(135deg, rgba(8,14,28,0.9) 0%, rgba(13,23,46,0.75) 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: color }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={color} fillOpacity={0.9}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                            {repo.owner}/<span style={{ color }}>{repo.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span className="tag tag-blue" style={{ fontSize: '0.625rem' }}>
                              Live Webhooks
                            </span>
                            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                              {repo.default_branch || 'main'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <a 
                        href={`https://github.com/${fullName}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}
                        title="Open on GitHub"
                      >
                        ↗
                      </a>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '1.25rem', minHeight: 38 }}>
                      {repo.description || 'Monitored repository with active PR telemetry and intelligent workload routing.'}
                    </p>
                  </div>

                  <div>
                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <button
                        onClick={() => handleOpenInspector(repo)}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          fontSize: '0.8125rem',
                          padding: '0.5rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          background: `linear-gradient(135deg, ${color} 0%, #1d4ed8 100%)`,
                          borderColor: `${color}80`,
                          color: '#fff',
                          fontWeight: 600,
                          boxShadow: `0 0 15px ${color}30`
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span>Inspect & Review</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                        Connected {timeAgo(repo.created_at)}
                      </span>
                      <button 
                        onClick={() => handleRemove(repo.id, fullName)} 
                        className="btn btn-ghost" 
                        style={{ fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', padding: '0.2rem 0.5rem' }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* ── Individual Repository Inspector Modal ─── */}
      <RepoInspectorModal
        repo={inspectingRepo}
        isOpen={isInspectorOpen}
        onClose={handleCloseInspector}
        onRepoUpdated={loadRepositories}
      />
    </div>
  )
}
