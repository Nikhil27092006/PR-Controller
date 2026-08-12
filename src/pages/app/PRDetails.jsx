import React from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { MOCK_PR_DETAILS, MOCK_PRS } from '../../services/mockData'

const PC = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const SC = { Blocked: '#f87171', Reviewing: '#fbbf24', 'In Progress': '#60a5fa', Ready: '#34d399', Merged: '#8b5cf6' }
const CI_C = { success: '#34d399', failed: '#f87171', pending: '#fbbf24' }

export default function PRDetails() {
  const { id } = useParams()
  const pr = MOCK_PR_DETAILS[id] || MOCK_PRS.find(p => p.id === id)

  if (!pr) {
    return (
      <div className="app-page">
        <DashboardHeader title="Pull Request Not Found" />
        <div className="page-content">
          <div className="glass" style={{ borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>◈</div>
            <p className="body-lg">PR <strong>#{id}</strong> was not found in connected repositories.</p>
            <Link to="/prs" className="btn btn-outline-glow" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Back to Pull Requests</Link>
          </div>
        </div>
      </div>
    )
  }

  const priorityColor = PC[pr.priority] || '#60a5fa'
  const statusColor   = SC[pr.status]   || '#60a5fa'

  return (
    <div className="app-page">
      <DashboardHeader title={`PR #${pr.id}`} subtitle={pr.repo} />
      <div className="page-content">
        <Link to="/prs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-40)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '1rem' }}>
          ← Back to Pull Requests
        </Link>

        {/* Overview */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.5rem', borderColor: `${priorityColor}25` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.625rem', color: 'var(--text-100)' }}>{pr.title}</h2>
              <p style={{ color: 'var(--text-60)', fontSize: '0.875rem', marginBottom: '1rem', maxWidth: 600 }}>{pr.desc}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag tag-blue">{pr.repo}</span>
                <span className="tag" style={{ fontFamily: 'var(--font-mono)' }}>{pr.branch} → {pr.baseBranch}</span>
                <span className="tag tag-cyan">+{pr.additions} / -{pr.deletions}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: priorityColor }}>{pr.priorityScore}</span>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)' }}>Priority Score</div>
                  <span className="tag" style={{ fontSize: '0.6875rem', color: priorityColor, borderColor: `${priorityColor}40`, background: `${priorityColor}15` }}>{pr.priority}</span>
                </div>
              </div>
              <span className="tag" style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}15` }}>{pr.status}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Priority Breakdown */}
          {pr.priorityBreakdown && (
            <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
              <h3 className="section-title" style={{ marginBottom: '1rem' }}>Priority Breakdown</h3>
              {pr.priorityBreakdown.map((b, i) => (
                <div key={i} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{b.factor}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: priorityColor, fontWeight: 700 }}>+{b.score}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border-4)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(b.score / 40) * 100}%`, background: `linear-gradient(90deg, ${priorityColor}88, ${priorityColor})`, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginTop: '0.25rem' }}>{b.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* CI/CD Status */}
          {pr.ciRuns && (
            <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
              <h3 className="section-title" style={{ marginBottom: '1rem' }}>CI / CD Status</h3>
              {pr.ciRuns.map((run, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: i < pr.ciRuns.length - 1 ? '1px solid var(--border-4)' : 'none' }}>
                  <span style={{ color: CI_C[run.status], fontSize: '1rem', fontWeight: 700, width: 16, flexShrink: 0 }}>{run.status === 'success' ? '✓' : run.status === 'failed' ? '✗' : '⟳'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{run.name}</div>
                    {run.error && <div style={{ fontSize: '0.6875rem', color: '#f87171', marginTop: '0.1rem' }}>{run.error}</div>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-40)' }}>{run.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependency Analysis */}
        <div className="glass" style={{ borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>Dependency Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Blocking</div>
              {pr.dependencies?.blocking?.length ? pr.dependencies.blocking.map(depId => (
                <Link key={depId} to={`/prs/${depId}`} className="tag tag-amber" style={{ display: 'inline-flex', marginRight: '0.375rem', marginBottom: '0.375rem', textDecoration: 'none' }}>PR #{depId}</Link>
              )) : <span style={{ color: 'var(--text-40)', fontSize: '0.8125rem' }}>No blockers</span>}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Blocked By This PR</div>
              {pr.dependencies?.blocked?.length ? pr.dependencies.blocked.map(depId => (
                <Link key={depId} to={`/prs/${depId}`} className="tag tag-red" style={{ display: 'inline-flex', marginRight: '0.375rem', marginBottom: '0.375rem', textDecoration: 'none' }}>PR #{depId}</Link>
              )) : <span style={{ color: 'var(--text-40)', fontSize: '0.8125rem' }}>No downstream blocks</span>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {pr.timeline && (
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Timeline</h3>
            <div className="timeline">
              {pr.timeline.map((ev, i) => (
                <div key={i} className="timeline-event">
                  <div className={`timeline-dot ${ev.status === 'failed' ? 'dot-red' : ev.type === 'create' ? 'dot-blue' : ev.type === 'review' ? 'dot-cyan' : 'dot-default'}`} />
                  <div className="timeline-body">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {ev.user && <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-100)' }}>{ev.user}</span>}
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-60)' }}>{ev.action}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginLeft: 'auto' }}>{ev.date}</span>
                    </div>
                    {ev.text && <div style={{ fontSize: '0.8125rem', color: 'var(--text-60)', marginTop: '0.4rem', padding: '0.625rem', background: 'var(--bg-glass)', borderRadius: 8, borderLeft: '2px solid var(--border-8)' }}>{ev.text}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
