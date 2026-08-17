import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { getReviewers, updateReviewerCapacity } from '../../services/reviewerService'
import { useApp } from '../../store/AppContext'

const STATUS_COLORS = {
  overloaded: { text: '#fca5a5', bar: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  busy:       { text: '#fcd34d', bar: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  available:  { text: '#6ee7b7', bar: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' }
}

const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }

function initialsFor(username) {
  return username.slice(0, 2).toUpperCase()
}

export default function ReviewerAnalytics() {
  const { repos: contextRepos, showToast } = useApp()
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const repoNameById = Object.fromEntries(
    contextRepos.map(r => [r.id, `${r.owner}/${r.name}`])
  )

  useEffect(() => {
    setLoading(true)
    setError(null)

    getReviewers()
      .then(setReviewers)
      .catch(err => setError(err.message || 'Failed to load reviewer data'))
      .finally(() => setLoading(false))
  }, [])

  const handleCapacityChange = async (reviewerId, delta) => {
    const reviewer = reviewers.find(r => r.reviewer_id === reviewerId)
    if (!reviewer) return

    const newCapacity = Math.min(50, Math.max(1, reviewer.capacity + delta))
    if (newCapacity === reviewer.capacity) return

    setUpdatingId(reviewerId)

    // Optimistic update — recompute load_percent/status locally so
    // the UI responds instantly, then reconcile with the server.
    const optimisticLoad = Math.round((reviewer.assigned_count / newCapacity) * 100)
    setReviewers(prev => prev.map(r =>
      r.reviewer_id === reviewerId
        ? { ...r, capacity: newCapacity, load_percent: optimisticLoad }
        : r
    ))

    try {
      await updateReviewerCapacity(reviewerId, newCapacity)
    } catch (err) {
      showToast(err.message || 'Failed to update capacity', 'error')
      // Revert on failure.
      setReviewers(prev => prev.map(r =>
        r.reviewer_id === reviewerId ? reviewer : r
      ))
    } finally {
      setUpdatingId(null)
    }
  }

  const overloaded = reviewers.filter(r => r.status === 'overloaded').length
  const available  = reviewers.filter(r => r.status === 'available').length
  const avgLoad     = reviewers.length
    ? Math.round(reviewers.reduce((s, r) => s + r.load_percent, 0) / reviewers.length)
    : 0
  const pending     = reviewers.reduce((s, r) => s + r.assigned_count, 0)

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Reviewer Analytics" subtitle="Workload distribution across your repositories" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>Loading reviewer data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Reviewer Analytics" subtitle="Workload distribution across your repositories" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader title="Reviewer Analytics" subtitle="Workload distribution across your repositories" />
      <div className="page-content">
        {/* Top Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total Reviewers', value: reviewers.length, color: '#60a5fa' },
            { label: 'Overloaded', value: overloaded, color: '#f87171' },
            { label: 'Available', value: available, color: '#34d399' },
            { label: 'Avg Load', value: `${avgLoad}%`, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass" style={{ borderColor: `${s.color}1e` }}>
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {reviewers.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-40)', marginTop: '1.5rem' }}>
            No reviewer activity yet. Reviewers appear here once PRs in your repositories have
            requested reviewers assigned on GitHub.
          </div>
        ) : (
          <>
            <h2 className="section-title" style={{ margin: '1.5rem 0 1rem' }}>Reviewer Workload ({pending} PRs pending review)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {reviewers.map((r) => {
                const c = STATUS_COLORS[r.status] || STATUS_COLORS.available
                return (
                  <div key={r.reviewer_id} className="glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: c.border, background: c.bg }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="reviewer-avatar" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: `1px solid ${c.border}`, color: c.text }}>
                        {initialsFor(r.username)}
                      </div>
                      <div>
                        <div className="reviewer-name">{r.username}</div>
                        <div className="reviewer-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{r.assigned_count} of {r.capacity} capacity</span>
                          <button
                            onClick={() => handleCapacityChange(r.reviewer_id, -1)}
                            disabled={updatingId === r.reviewer_id || r.capacity <= 1}
                            aria-label={`Decrease ${r.username}'s capacity`}
                            style={{ width: 16, height: 16, lineHeight: 1, fontSize: '0.7rem', borderRadius: 4, border: '1px solid var(--border-8)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-60)', cursor: 'pointer', padding: 0 }}
                          >−</button>
                          <button
                            onClick={() => handleCapacityChange(r.reviewer_id, 1)}
                            disabled={updatingId === r.reviewer_id || r.capacity >= 50}
                            aria-label={`Increase ${r.username}'s capacity`}
                            style={{ width: 16, height: 16, lineHeight: 1, fontSize: '0.7rem', borderRadius: 4, border: '1px solid var(--border-8)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-60)', cursor: 'pointer', padding: 0 }}
                          >+</button>
                        </div>
                        <span className="tag" style={{ fontSize: '0.6rem', color: c.text, borderColor: c.border, background: `${c.bar}18`, marginTop: '0.25rem' }}>
                          {r.status}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: c.text, lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          {r.load_percent}%
                          {r.is_overloaded && <span title="Overloaded">⚠</span>}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginBottom: '0.375rem' }}>{r.assigned_count} pending</div>
                        <div style={{ height: 4, width: 90, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginLeft: 'auto' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, r.load_percent)}%`, background: c.bar, borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>

                    {r.assigned_prs.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {r.assigned_prs.slice(0, 3).map(pr => (
                          <Link
                            key={pr.id}
                            to="/prs"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.65rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, textDecoration: 'none' }}
                          >
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-70, #d1d5db)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                              #{pr.github_pr_number} {pr.title}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: PRIORITY_COLORS[pr.priority_level] || '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>
                              {pr.priority_level}
                            </span>
                          </Link>
                        ))}
                        {r.assigned_prs.length > 3 && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', textAlign: 'center', padding: '0.15rem' }}>
                            +{r.assigned_prs.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
