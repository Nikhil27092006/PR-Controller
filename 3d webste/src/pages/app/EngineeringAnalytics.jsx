import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { LineChart, BarChart } from '../../components/shared/ChartMock'
import { MOCK_ANALYTICS } from '../../services/mockData'
import { useApp } from '../../store/AppContext'

export default function EngineeringAnalytics() {
  const [range, setRange] = useState('6W')
  const { selectedRepoId, repos: contextRepos } = useApp()

  const activeRepo = selectedRepoId !== 'all'
    ? contextRepos.find(r => r.id === selectedRepoId)
    : null
  const activeRepoName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : null

  const subtitle = activeRepoName
    ? `Productivity trends for ${activeRepoName}`
    : 'Productivity trends and velocity insights'

  const charts = [
    { title: 'Review Time Trend', subtitle: 'Average hours from PR open to first review', data: MOCK_ANALYTICS.reviewTimeTrend, color: '#3b82f6', type: 'line' },
    { title: 'Merge Time Trend', subtitle: 'Average hours from PR open to merge', data: MOCK_ANALYTICS.mergeTimeTrend, color: '#22d3ee', type: 'line' },
    { title: 'Bottleneck Frequency', subtitle: 'Number of blocked PRs detected per week', data: MOCK_ANALYTICS.blockersTrend, color: '#f87171', type: 'line' },
  ]

  return (
    <div className="app-page">
      <DashboardHeader title="Engineering Analytics" subtitle={subtitle} />
      <div className="page-content">
        {/* Time range */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['2W','4W','6W','3M'].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`btn btn-ghost ${range === r ? 'btn-ghost-active' : ''}`} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', ...(range === r ? { background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: 'var(--blue-300)' } : {}) }}>
              {r}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '2rem' }}>
          {[
            { label: 'Avg Review Time', value: '3.8h', delta: '−31%', color: '#34d399' },
            { label: 'Avg Merge Time', value: '18.2h', delta: '−40%', color: '#34d399' },
            { label: 'PRs Created', value: '28', delta: '+4 vs prior', color: '#60a5fa' },
            { label: 'Blockers Detected', value: '2', delta: '−78% low', color: '#34d399' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass">
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value-row">
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-trend trend-up" style={{ color: s.color }}>{s.delta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Line charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {charts.slice(0, 2).map((chart, i) => (
            <div key={i} className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 className="section-title">{chart.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>{chart.subtitle}</p>
              </div>
              <LineChart data={chart.data} color={chart.color} height={120} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Blockers chart */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">Bottleneck Frequency</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>Blocked PRs detected per week</p>
            </div>
            <LineChart data={MOCK_ANALYTICS.blockersTrend} color="#f87171" height={120} />
          </div>

          {/* PR creation vs closed bar */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">PR Volume</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>Created vs. closed pull requests per week</p>
            </div>
            <BarChart data={MOCK_ANALYTICS.prCreationClosed} aKey="created" bKey="closed" aColor="#3b82f6" bColor="#22d3ee" height={120} />
          </div>
        </div>
      </div>
    </div>
  )
}
