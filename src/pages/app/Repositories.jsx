import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

export default function Repositories() {
  const { repos, connectRepo, disconnectRepo, showToast } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [newRepo, setNewRepo] = useState('')

  const STATUS_C = { synced: '#34d399', syncing: '#fbbf24', disconnected: '#8b5cf6' }

  const handleAddRepo = (e) => {
    e.preventDefault()
    if (!newRepo.trim()) return
    showToast(`Repository ${newRepo} queued for connection.`, 'info')
    setNewRepo('')
    setShowAdd(false)
  }

  return (
    <div className="app-page">
      <DashboardHeader title="Repositories" subtitle="Connect and manage your GitHub repositories" />
      <div className="page-content">
        {/* Stats row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Connected Repos', value: repos.filter(r => r.connected).length, color: '#34d399' },
            { label: 'Total PRs Tracked', value: repos.reduce((s, r) => s + r.prCount, 0), color: '#60a5fa' },
            { label: 'Currently Syncing', value: repos.filter(r => r.status === 'syncing').length, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass">
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
          <h2 className="section-title">Repository List</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary">+ Add Repository</button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddRepo} className="glass" style={{ borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-repo">Repository (owner/name)</label>
              <input id="new-repo" type="text" placeholder="e.g. microsoft/vscode" value={newRepo} onChange={e => setNewRepo(e.target.value)} className="form-input" />
            </div>
            <button type="submit" className="btn btn-primary">Connect</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn btn-ghost">Cancel</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {repos.map((repo) => (
            <div key={repo.id} className="glass" style={{ borderRadius: 12, padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderColor: repo.connected ? `${repo.color}25` : 'var(--border-4)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${repo.color}18`, border: `1px solid ${repo.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={repo.color} fillOpacity={0.8}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-100)', fontSize: '0.875rem' }}>{repo.owner}/<span style={{ color: repo.color }}>{repo.name}</span></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.15rem' }}>Last sync: {repo.lastSync}</div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--blue-400)' }}>{repo.prCount}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)' }}>Open PRs</div>
                </div>
                <span className="tag" style={{ color: STATUS_C[repo.status] || 'var(--text-60)', borderColor: `${STATUS_C[repo.status]}35`, background: `${STATUS_C[repo.status]}12` }}>{repo.status}</span>
                {repo.connected
                  ? <button onClick={() => disconnectRepo(repo.id)} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>Disconnect</button>
                  : <button onClick={() => connectRepo(repo.id)} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>Connect</button>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
