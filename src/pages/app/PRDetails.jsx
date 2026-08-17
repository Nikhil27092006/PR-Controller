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
      .catch(err => setError(err.message || 'Failed to load pull request telemetry'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="PR Telemetry" />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Loading Pull Request Breakdown...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Analyzing priority weight factors, dependency paths, and reviewer queues.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !pr) {
    return (
      <div className="app-page">
        <DashboardHeader title="Pull Request Not Found" />
        <div className="page-content">
          <div className="glass" style={{ borderRadius: 16, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 600, margin: '2rem auto' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f87171' }}>◈</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Pull Request Not Available
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {error || <>PR <strong>#{id}</strong> was not found in your connected GitHub repositories.</>}
            </p>
            <Link to="/prs" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              ← Return to Pull Requests
            </Link>
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
      <DashboardHeader 
        title={`PR #${pr.github_pr_number} • ${pr.title}`} 
        subtitle={`Repository: ${pr.repository_full_name}`} 
      />

      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link to="/prs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', textDecoration: 'none' }}>
            ← Back to Pull Requests
          </Link>

          <span className="glow-pill" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}35` }}>
            Status: {pr.status.toUpperCase()}
          </span>
        </div>

        {/* ── Executive Overview Card ─── */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.25rem', borderColor: `${priorityColor}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '40%', height: '140%', background: `radial-gradient(circle, ${priorityColor}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span className="tag tag-blue" style={{ fontSize: '0.75rem' }}>📦 {pr.repository_full_name}</span>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                  by <strong style={{ color: '#fff' }}>{pr.author || 'Unknown'}</strong>
                </span>
                {pr.merge_conflict && (
                  <span className="risk-chip risk-chip-danger">
                    ⚠️ Merge Conflict
                  </span>
                )}
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                {pr.title}
              </h2>

              {pr.description ? (
                <div style={{ padding: '0.875rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                  {pr.description}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                  No description provided on GitHub.
                </p>
              )}
            </div>

            {/* Holographic Score Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem 1.75rem', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: `1px solid ${priorityColor}35`, minWidth: 150, textAlign: 'center' }}>
              <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                Triage Priority
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: priorityColor, lineHeight: 1.1, margin: '0.2rem 0' }}>
                {pr.priority_score}
              </div>
              <span className="tag" style={{ color: priorityColor, borderColor: `${priorityColor}40`, background: `${priorityColor}15`, fontSize: '0.6875rem', fontWeight: 700 }}>
                {pr.priority_level} Priority
              </span>
            </div>
          </div>
        </div>

        {/* ── Mid Section: Scoring Breakdown & Reviewers ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Priority Factor Breakdown */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Priority Algorithm Breakdown</h3>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                Multi-factor heuristic
              </span>
            </div>

            {pr.priority_breakdown.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', padding: '1.5rem 0', textAlign: 'center' }}>
                No scoring factors applied. Default priority used.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pr.priority_breakdown.map((factor, i) => {
                  const factorPct = Math.round((factor.score / maxFactorScore) * 100)
                  return (
                    <div key={i} style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>{factor.factor}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: priorityColor, fontWeight: 800 }}>
                          +{factor.score} pts
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${factorPct}%`, background: `linear-gradient(90deg, ${priorityColor}80, ${priorityColor})`, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem' }}>
                        {factor.description}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assigned Reviewers */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Assigned Reviewers</h3>
              <Link to="/reviewers" className="section-link">Workload Radar →</Link>
            </div>

            {pr.reviewers.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>👥</div>
                <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600 }}>No Reviewers Assigned</div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                  Assign code reviewers on GitHub to automatically populate routing telemetry.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {pr.reviewers.map((r) => (
                  <div key={r.reviewer_id} className="workload-card-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="reviewer-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {r.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>{r.username}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>Reviewer queue</div>
                        </div>
                      </div>
                      <span className="tag" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Section: Dependency Topology & Timeline ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Dependency Topology */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Dependency Topology</h3>
              <Link to="/dependencies" className="section-link">View Full Graph →</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.875rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6875rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  ⏳ Waiting On (Blockers)
                </div>
                {pr.blocking.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {pr.blocking.map(dep => (
                      <Link key={dep.id} to={`/prs/${dep.id}`} className="tag tag-amber" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', padding: '0.35rem 0.5rem' }}>
                        <span>PR #{dep.github_pr_number}</span>
                        <span>Inspect →</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>No upstream blockers</span>
                )}
              </div>

              <div style={{ padding: '0.875rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.6875rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  ⚠️ Blocking (Downstream)
                </div>
                {pr.blocked_by.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {pr.blocked_by.map(dep => (
                      <Link key={dep.id} to={`/prs/${dep.id}`} className="tag tag-red" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', padding: '0.35rem 0.5rem' }}>
                        <span>PR #{dep.github_pr_number}</span>
                        <span>Inspect →</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>No downstream dependants</span>
                )}
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Telemetry Timeline</h3>
            </div>

            <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.08)' }} />
              {pr.timeline.map((ev, i) => {
                const color = TIMELINE_COLOR[ev.type] || '#94a3b8'
                return (
                  <div key={i} style={{ position: 'relative', paddingBottom: i < pr.timeline.length - 1 ? '1.25rem' : 0 }}>
                    <div style={{ position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        {ev.actor && <strong style={{ fontSize: '0.8125rem', color: '#fff', marginRight: '0.35rem' }}>{ev.actor}</strong>}
                        <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>{ev.label}</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

