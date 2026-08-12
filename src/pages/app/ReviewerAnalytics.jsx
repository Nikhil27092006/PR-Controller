import React from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { MOCK_REVIEWERS, MOCK_RECOMMENDATIONS } from '../../services/mockData'
import { useApp } from '../../store/AppContext'

const STATUS_COLORS = { overloaded: { text: '#fca5a5', bar: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' }, busy: { text: '#fcd34d', bar: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' }, available: { text: '#6ee7b7', bar: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' } }

export default function ReviewerAnalytics() {
  const { selectedRepoId, repos: contextRepos } = useApp()

  const activeRepo = selectedRepoId !== 'all'
    ? contextRepos.find(r => r.id === selectedRepoId)
    : null
  const activeRepoName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : null

  const subtitle = activeRepoName
    ? `Workload distribution for ${activeRepoName}`
    : 'Workload distribution and reviewer routing'

  const overloaded = MOCK_REVIEWERS.filter(r => r.status === 'overloaded').length
  const available  = MOCK_REVIEWERS.filter(r => r.status === 'available').length
  const avgLoad    = Math.round(MOCK_REVIEWERS.reduce((s, r) => s + r.load, 0) / MOCK_REVIEWERS.length)
  const pending    = MOCK_REVIEWERS.reduce((s, r) => s + r.pending, 0)

  return (
    <div className="app-page">
      <DashboardHeader title="Reviewer Analytics" subtitle={subtitle} />
      <div className="page-content">
        {/* Top Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total Reviewers', value: MOCK_REVIEWERS.length, color: '#60a5fa' },
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

        {/* Recommendations */}
        <div className="glass" style={{ borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>
            <span style={{ color: 'var(--blue-300)' }}>Smart Routing Recommendations</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="glass-md" style={{ borderRadius: 10, padding: '0.875rem 1.125rem' }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--blue-300)', marginBottom: '0.25rem' }}>
                      Route PR #{rec.prId}: {rec.fromReviewer} → {rec.toReviewer}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-60)' }}>{rec.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviewer Cards Grid */}
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>Reviewer Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {MOCK_REVIEWERS.map((r, i) => {
            const c = STATUS_COLORS[r.status]
            return (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: c.border, background: c.bg }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                  <div className="reviewer-avatar" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: `1px solid ${c.border}`, color: c.text }}>{r.initials}</div>
                  <div>
                    <div className="reviewer-name">{r.name}</div>
                    <div className="reviewer-role">{r.role}</div>
                    <span className="tag" style={{ fontSize: '0.6rem', color: c.text, borderColor: c.border, background: `${c.bar}18`, marginTop: '0.25rem' }}>{r.status}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: c.text, lineHeight: 1 }}>{r.load}%</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginBottom: '0.375rem' }}>{r.pending} pending</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${r.load}%`, background: c.bar, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-40)' }}>{r.timeMetric}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
