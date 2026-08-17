import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { getPRDetail } from '../../services/prService'

const PC = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const SC = { blocked: '#f87171', open: '#60a5fa', merged: '#8b5cf6', closed: '#94a3b8' }

const TIMELINE_COLOR = {
  created: '#60a5fa',
  review: '#22d3ee',
  merged: '#a855f7',
  closed: '#f87171'
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

export default function PRDetails() {
  const { id } = useParams()
  const [pr, setPr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getPRDetail(id)
      .then(setPr)
      .catch(err => setError(err.message || 'Failed to load pull request'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Pull Request" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !pr) {
    return (
      <div className="app-page">
        <DashboardHeader title="Pull Request Not Found" />
        <div className="page-content">
          <div className="glass" style={{ borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>◈</div>
            <p className="body-lg">
              {error || <>PR <strong>#{id}</strong> was not found in your connected repositories.</>}
            </p>
            <Link to="/prs" className="btn btn-outline-glow" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Back to Pull Requests</Link>
          </div>
        </div>
      </div>
    )
  }

  const priorityColor = PC[pr.priority_level] || '#60a5fa'
  const statusColor = SC[pr.status] || '#60a5fa'
  const maxFactorScore = pr.priority_breakdown.length
    ? Math.max(...pr.priority_breakdown.map(b => b.score))
    : 1

  return (
    <div className="app-page">
      <DashboardHeader title={`PR #${pr.github_pr_number}`} subtitle={pr.repository_full_name} />
      <div className="page-content">
        <Link to="/prs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-40)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Back to Pull Requests
        </Link>

        {/* Overview */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.5rem', borderColor: `${priorityColor}25` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.625rem', color: 'var(--text-100)' }}>{pr.title}</h2>
              {pr.description && (
                <p style={{ color: 'var(--text-60)', fontSize: '0.875rem', marginBottom: '1rem', maxWidth: 600, whiteSpace: 'pre-wrap' }}>{pr.description}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag tag-blue">{pr.repository_full_name}</span>
                {pr.author && <span className="tag" style={{ fontFamily: 'var(--font-mono)' }}>by {pr.author}</span>}
                {pr.merge_conflict && <span className="tag" style={{ color: '#f87171', borderColor: '#f8717140', background: '#f8717115' }}>Merge Conflict</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: priorityColor }}>{pr.priority_score}</span>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)' }}>Priority Score</div>
                  <span className="tag" style={{ fontSize: '0.6875rem', color: priorityColor, borderColor: `${priorityColor}40`, background: `${priorityColor}15` }}>{pr.priority_level}</span>
                </div>
              </div>
              <span className="tag" style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}15` }}>{pr.status}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Priority Breakdown */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>Priority Breakdown</h3>
            {pr.priority_breakdown.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)' }}>No scoring factors applied.</p>
            ) : (
              pr.priority_breakdown.map((b, i) => (
                <div key={i} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{b.factor}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: priorityColor, fontWeight: 700 }}>+{b.score}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border-4)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(b.score / maxFactorScore) * 100}%`, background: `linear-gradient(90deg, ${priorityColor}88, ${priorityColor})`, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginTop: '0.25rem' }}>{b.description}</div>
                </div>
              ))
            )}
          </div>

          {/* Reviewers */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>Reviewers</h3>
            {pr.reviewers.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)' }}>No reviewers assigned.</p>
            ) : (
              pr.reviewers.map((r, i) => (
                <div key={r.reviewer_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: i < pr.reviewers.length - 1 ? '1px solid var(--border-4)' : 'none' }}>
                  <div className="reviewer-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>{r.username.slice(0, 2).toUpperCase()}</div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)', flex: 1 }}>{r.username}</span>
                  <span className="tag" style={{ fontSize: '0.65rem' }}>{r.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dependency Analysis */}
        <div className="glass" style={{ borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>Dependency Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                Waiting On (Blocking This PR)
              </div>
              {pr.blocking.length ? pr.blocking.map(dep => (
                <Link key={dep.id} to={`/prs/${dep.id}`} className="tag tag-amber" style={{ display: 'inline-flex', marginRight: '0.375rem', marginBottom: '0.375rem', textDecoration: 'none' }}>
                  PR #{dep.github_pr_number}
                </Link>
              )) : <span style={{ color: 'var(--text-40)', fontSize: '0.8125rem' }}>No blockers</span>}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                Blocked By This PR
              </div>
              {pr.blocked_by.length ? pr.blocked_by.map(dep => (
                <Link key={dep.id} to={`/prs/${dep.id}`} className="tag tag-red" style={{ display: 'inline-flex', marginRight: '0.375rem', marginBottom: '0.375rem', textDecoration: 'none' }}>
                  PR #{dep.github_pr_number}
                </Link>
              )) : <span style={{ color: 'var(--text-40)', fontSize: '0.8125rem' }}>No downstream blocks</span>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Timeline</h3>
          <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
            <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1.5, background: 'var(--border-8)' }} />
            {pr.timeline.map((ev, i) => {
              const color = TIMELINE_COLOR[ev.type] || '#94a3b8'
              return (
                <div key={i} style={{ position: 'relative', paddingBottom: i < pr.timeline.length - 1 ? '1.25rem' : 0 }}>
                  <div style={{ position: 'absolute', left: -19, top: 3, width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px ${color}25` }} />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {ev.actor && <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-100)' }}>{ev.actor}</span>}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-60)' }}>{ev.label}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginLeft: 'auto' }}>{formatDate(ev.timestamp)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
