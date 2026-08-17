import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { getReviewers, updateReviewerCapacity } from '../../services/reviewerService'
import { useApp } from '../../store/AppContext'

const STATUS_COLORS = {
  overloaded: { text: '#fca5a5', bar: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)' },
  busy:       { text: '#fcd34d', bar: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)' },
  available:  { text: '#6ee7b7', bar: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.3)' }
}

const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }

function initialsFor(username) {
  return (username || '??').slice(0, 2).toUpperCase()
}

export default function ReviewerAnalytics() {
  const { repos: contextRepos, showToast } = useApp()
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    setError(null)

    getReviewers()
      .then(setReviewers)
      .catch(err => setError(err.message || 'Failed to load reviewer telemetry'))
      .finally(() => setLoading(false))
  }, [])

  const handleCapacityChange = async (reviewerId, delta) => {
    const reviewer = reviewers.find(r => r.reviewer_id === reviewerId)
    if (!reviewer) return

    const newCapacity = Math.min(50, Math.max(1, reviewer.capacity + delta))
    if (newCapacity === reviewer.capacity) return

    setUpdatingId(reviewerId)

    const optimisticLoad = Math.round((reviewer.assigned_count / newCapacity) * 100)
    setReviewers(prev => prev.map(r =>
      r.reviewer_id === reviewerId
        ? { ...r, capacity: newCapacity, load_percent: optimisticLoad }
        : r
    ))

    try {
      await updateReviewerCapacity(reviewerId, newCapacity)
      showToast(`Updated ${reviewer.username}'s review capacity to ${newCapacity}`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update capacity', 'error')
      setReviewers(prev => prev.map(r =>
        r.reviewer_id === reviewerId ? reviewer : r
      ))
    } finally {
      setUpdatingId(null)
    }
  }

  const overloaded = useMemo(() => reviewers.filter(r => r.status === 'overloaded').length, [reviewers])
  const available  = useMemo(() => reviewers.filter(r => r.status === 'available').length, [reviewers])
  const avgLoad     = useMemo(() => reviewers.length
    ? Math.round(reviewers.reduce((s, r) => s + r.load_percent, 0) / reviewers.length)
    : 0, [reviewers])
  const pending     = useMemo(() => reviewers.reduce((s, r) => s + r.assigned_count, 0), [reviewers])

  const filteredReviewers = useMemo(() => {
    if (statusFilter === 'all') return reviewers
    return reviewers.filter(r => r.status === statusFilter)
  }, [reviewers, statusFilter])

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Reviewer Radar" subtitle="Team workload balancing and capacity distribution" />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Synthesizing Reviewer Queue Profiles...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Analyzing active PR reviews, turnaround delays, and load capacity ceilings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Reviewer Radar" subtitle="Team workload balancing and capacity distribution" />
        <div className="page-content">
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#f87171' }}>⚠️</div>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader 
        title="Reviewer Radar" 
        subtitle={`Managing ${reviewers.length} active reviewers across connected repositories`} 
      />

      <div className="page-content">

        {/* ── Top Metric Cards ─── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.25rem' }}>
          {[
            { label: 'Active Reviewers', value: reviewers.length, color: '#60a5fa', sub: `${pending} total pending reviews` },
            { label: 'Overloaded Engineers', value: overloaded, color: '#f87171', sub: overloaded > 0 ? 'Exceeds capacity' : 'Zero bottlenecks' },
            { label: 'Available Capacity', value: available, color: '#34d399', sub: 'Ready for new assignments' },
            { label: 'Team Avg Load', value: `${avgLoad}%`, color: '#fbbf24', sub: 'Optimal band 40%-70%' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: `${s.color}25` }}>
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color, marginTop: '0.35rem' }}>{s.value}</div>
              <p className="stat-card-subtitle">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Overload Alert Notification if any ─── */}
        {overloaded > 0 && (
          <div className="glass" style={{ borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#fca5a5', fontSize: '0.875rem' }}>Reviewer Overload Detected</strong>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0 }}>
                  {overloaded} team member{overloaded === 1 ? ' has' : 's have'} exceeded their target PR queue threshold. Rebalance assignments to prevent review stalls.
                </p>
              </div>
            </div>
            <Link to="/prs" className="btn btn-ghost" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '0.75rem' }}>
              Re-route PRs →
            </Link>
          </div>
        )}

        {/* ── Filter Bar ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['all', 'overloaded', 'busy', 'available'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`btn btn-ghost ${statusFilter === tab ? 'btn-ghost-active' : ''}`}
                style={{
                  textTransform: 'capitalize',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  ...(statusFilter === tab ? { background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: 'var(--blue-300)' } : {})
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            Showing {filteredReviewers.length} of {reviewers.length} reviewers
          </span>
        </div>

        {filteredReviewers.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--cyan-400)' }}>👥</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Reviewers Found
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto' }}>
              Reviewers appear automatically once pull requests in your connected repositories have requested reviewers assigned on GitHub.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {filteredReviewers.map((r) => {
              const c = STATUS_COLORS[r.status] || STATUS_COLORS.available
              return (
                <div 
                  key={r.reviewer_id} 
                  className="glass" 
                  style={{ 
                    borderRadius: 14, 
                    padding: '1.25rem 1.35rem', 
                    borderColor: c.border, 
                    background: `linear-gradient(135deg, ${c.bg} 0%, rgba(8,14,28,0.7) 100%)`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '0.875rem', alignItems: 'center' }}>
                    <div className="reviewer-avatar" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${c.border}`, color: c.text, fontSize: '0.9rem', fontWeight: 800 }}>
                      {initialsFor(r.username)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                        {r.username}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                          {r.assigned_count} of {r.capacity} max
                        </span>
                        {/* Stepper buttons */}
                        <div style={{ display: 'inline-flex', gap: '2px' }}>
                          <button
                            onClick={() => handleCapacityChange(r.reviewer_id, -1)}
                            disabled={updatingId === r.reviewer_id || r.capacity <= 1}
                            aria-label={`Decrease ${r.username}'s capacity`}
                            style={{ width: 18, height: 18, lineHeight: 1, fontSize: '0.75rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >
                            −
                          </button>
                          <button
                            onClick={() => handleCapacityChange(r.reviewer_id, 1)}
                            disabled={updatingId === r.reviewer_id || r.capacity >= 50}
                            aria-label={`Increase ${r.username}'s capacity`}
                            style={{ width: 18, height: 18, lineHeight: 1, fontSize: '0.75rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, color: c.text, lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {r.load_percent}%
                        {r.is_overloaded && <span title="Overloaded" style={{ fontSize: '0.9rem' }}>⚠️</span>}
                      </div>
                      <span className="tag" style={{ fontSize: '0.6rem', color: c.text, borderColor: c.border, background: `${c.bar}18`, marginTop: '0.3rem', textTransform: 'capitalize' }}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Workload bar */}
                  <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginTop: '0.875rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, r.load_percent)}%`, background: `linear-gradient(90deg, ${c.bar}80, ${c.bar})`, borderRadius: 3, boxShadow: `0 0 8px ${c.bar}40` }} />
                  </div>

                  {/* Assigned PRs preview list */}
                  {r.assigned_prs.length > 0 && (
                    <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {r.assigned_prs.slice(0, 3).map(pr => (
                        <Link
                          key={pr.id}
                          to={`/prs/${pr.id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.45rem 0.75rem',
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                            #{pr.github_pr_number} {pr.title}
                          </span>
                          <span style={{ fontSize: '0.625rem', color: PRIORITY_COLORS[pr.priority_level] || '#94a3b8', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem' }}>
                            {pr.priority_level}
                          </span>
                        </Link>
                      ))}
                      {r.assigned_prs.length > 3 && (
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingTop: '0.2rem' }}>
                          +{r.assigned_prs.length - 3} more assigned PRs
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

