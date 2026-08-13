import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

// Backend doesn't store a display color per repo, so derive a
// stable one client-side from the repo name.
const PALETTE = ['#61dafb', '#34d399', '#a855f7', '#fbbf24', '#f87171', '#60a5fa', '#22d3ee']

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function timeAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export default function Repositories() {
  const { repos, reposLoading, addRepository, removeRepository } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [newRepo, setNewRepo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleAddRepo = async (e) => {
    e.preventDefault()
    setFormError('')

    const trimmed = newRepo.trim()
    const parts = trimmed.split('/')

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setFormError('Enter a repository as owner/name, e.g. microsoft/vscode')
      return
    }

    setSubmitting(true)
    try {
      await addRepository(parts[0], parts[1])
      setNewRepo('')
      setShowAdd(false)
    } catch (err) {
      setFormError(err.message || 'Failed to add repository')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = (id) => {
    removeRepository(id).catch(() => {
      // error toast already shown by AppContext
    })
  }

  return (
    <div className="app-page">
      <DashboardHeader title="Repositories" subtitle="Connect and manage your GitHub repositories" />
      <div className="page-content">
        {/* Stats row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-card glass">
            <h3 className="stat-card-title">Connected Repos</h3>
            <div className="stat-card-value" style={{ color: '#34d399' }}>{repos.length}</div>
          </div>
          <div className="stat-card glass">
            <h3 className="stat-card-title">Currently Syncing</h3>
            <div className="stat-card-value" style={{ color: '#fbbf24' }}>{reposLoading ? 1 : 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
          <h2 className="section-title">Repository List</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary">+ Add Repository</button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddRepo} className="glass" style={{ borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" htmlFor="new-repo">Repository (owner/name)</label>
                <input
                  id="new-repo"
                  type="text"
                  placeholder="e.g. microsoft/vscode"
                  value={newRepo}
                  onChange={e => setNewRepo(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Connecting...' : 'Connect'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-ghost" disabled={submitting}>
                Cancel
              </button>
            </div>
            {formError && (
              <div style={{ color: '#f87171', fontSize: '0.8125rem' }}>{formError}</div>
            )}
          </form>
        )}

        {reposLoading && repos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>
            Loading repositories...
          </div>
        ) : repos.length === 0 ? (
          <div className="glass" style={{ borderRadius: 12, padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>
            No repositories connected yet. Add one to start tracking pull requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {repos.map((repo) => {
              const color = colorFor(repo.name)
              return (
                <div
                  key={repo.id}
                  className="glass"
                  style={{ borderRadius: 12, padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderColor: `${color}25` }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} fillOpacity={0.8}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-100)', fontSize: '0.875rem' }}>
                      {repo.owner}/<span style={{ color }}>{repo.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.15rem' }}>
                      {repo.description || 'No description'} · Added {timeAgo(repo.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button onClick={() => handleRemove(repo.id)} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
