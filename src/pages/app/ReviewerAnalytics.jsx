import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import {
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon,
  ZapIcon
} from '../../components/shared/Icons'
import { getReviewers, updateReviewerCapacity } from '../../services/reviewerService'
import { useApp } from '../../store/AppContext'

const STATUS_COLORS = {
  overloaded: { text: '#f87171', border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.06)', bar: '#f87171' },
  busy:       { text: '#fbbf24', border: 'rgba(251,191,36,0.3)',  bg: 'rgba(251,191,36,0.06)',  bar: '#fbbf24' },
  available:  { text: '#34d399', border: 'rgba(52,211,153,0.3)',  bg: 'rgba(52,211,153,0.06)',  bar: '#34d399' }
}

function initialsFor(name) {
  if (!name) return '??'
  const parts = name.trim().split(/[\s._-]+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function ReviewerAnalytics() {
  const { showToast } = useApp()
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getReviewers()
      .then(setReviewers)
      .catch(err => setError(err.message || 'Failed to load reviewer analytics'))
      .finally(() => setLoading(false))
  }, [])

  const handleCapacityChange = async (reviewerId, delta) => {
    const current = reviewers.find(r => r.reviewer_id === reviewerId)
    if (!current) return
    const newCap = Math.max(1, Math.min(50, current.capacity + delta))
    if (newCap === current.capacity) return

    setUpdatingId(reviewerId)
    try {
      const updated = await updateReviewerCapacity(reviewerId, newCap)
      setReviewers(prev => prev.map(r => r.reviewer_id === reviewerId ? { ...r, ...updated } : r))
      showToast(`Updated @${current.username}'s capacity to ${newCap}`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update capacity', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReviewers = statusFilter === 'All'
    ? reviewers
    : reviewers.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase())

  const overloaded = reviewers.filter(r => r.is_overloaded).length
  const available  = reviewers.filter(r => r.status === 'available').length
  const pending    = reviewers.reduce((sum, r) => sum + r.assigned_count, 0)
  const avgLoad    = reviewers.length
    ? Math.round(reviewers.reduce((sum, r) => sum + r.load_percent, 0) / reviewers.length)
    : 0

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Reviewer Radar" subtitle="Team workload balancing and capacity distribution" />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Scanning Reviewer Workloads...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Calculating reviewer capacity, active queue depths, and bottleneck velocity.
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <AlertTriangleIcon size={32} color="#f87171" />
            </div>
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
              <AlertTriangleIcon size={20} color="#f87171" />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Available', 'Busy', 'Overloaded'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`btn btn-ghost ${statusFilter === f ? 'active' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  background: statusFilter === f ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: statusFilter === f ? 'var(--cyan-400)' : 'rgba(255,255,255,0.6)',
                  borderColor: statusFilter === f ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            Showing {filteredReviewers.length} of {reviewers.length} reviewers
          </span>
        </div>

        {filteredReviewers.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <UsersIcon size={40} color="var(--cyan-400)" />
            </div>
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
                        {r.is_overloaded && <AlertTriangleIcon size={14} color="#f87171" />}
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                    <span>Pending: {r.pending_reviews}</span>
                    <span>Completed: {r.completed_reviews}</span>
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
