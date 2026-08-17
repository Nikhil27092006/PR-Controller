import React, { useEffect, useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { LineChart, BarChart } from '../../components/shared/ChartMock'
import { getEngineeringAnalytics } from '../../services/analyticsService'
import { useApp } from '../../store/AppContext'

function formatHours(hours) {
  if (hours === null || hours === undefined) return '—'
  return `${hours}h`
}

export default function EngineeringAnalytics() {
  const [range, setRange] = useState('6W')
  const { selectedRepoId, repos: contextRepos } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const activeRepo = selectedRepoId !== 'all'
    ? contextRepos.find(r => r.id === Number(selectedRepoId))
    : null
  const activeRepoName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : null

  const subtitle = activeRepoName
    ? `Productivity trends for ${activeRepoName}`
    : 'Productivity trends and velocity insights'

  useEffect(() => {
    setLoading(true)
    setError(null)

    getEngineeringAnalytics(range, activeRepo ? activeRepo.id : undefined)
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [range, activeRepo])

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Engineering Analytics" subtitle={subtitle} />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="app-page">
        <DashboardHeader title="Engineering Analytics" subtitle={subtitle} />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>{error || 'No data available'}</div>
        </div>
      </div>
    )
  }

  const { summary, review_time_trend, merge_time_trend, blockers_trend, pr_volume_trend } = data

  // ChartMock's LineChart does Math.min/max across raw values, which
  // silently treats null as 0 anyway — converting explicitly here
  // makes that intentional instead of relying on implicit JS coercion,
  // and keeps every week's data point visible on the axis.
  const chartSafe = (trend) => trend.map(p => ({ ...p, value: p.value ?? 0 }))

  const reviewChartData = chartSafe(review_time_trend)
  const mergeChartData = chartSafe(merge_time_trend)

  const stats = [
    { label: 'Avg Review Time', value: formatHours(summary.avg_review_time_hours), color: '#60a5fa' },
    { label: 'Avg Merge Time', value: formatHours(summary.avg_merge_time_hours), color: '#22d3ee' },
    { label: 'PRs Created', value: summary.prs_created, color: '#34d399' },
    { label: 'New Dependency Links', value: summary.blockers_detected, color: '#fbbf24' },
  ]

  return (
    <div className="app-page">
      <DashboardHeader title="Engineering Analytics" subtitle={subtitle} />
      <div className="page-content">
        {/* Time range */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['2W', '4W', '6W', '3M'].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`btn btn-ghost ${range === r ? 'btn-ghost-active' : ''}`} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', ...(range === r ? { background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: 'var(--blue-300)' } : {}) }}>
              {r}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '2rem' }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card glass">
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Line charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">Review Time Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>Average hours from PR open to first submitted review, by week reviewed</p>
            </div>
            {review_time_trend.some(p => p.value !== null) ? (
              <LineChart data={reviewChartData} color="#3b82f6" height={120} />
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)', padding: '2rem 0', textAlign: 'center' }}>No reviewed PRs in this range yet.</p>
            )}
          </div>

          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">Merge Time Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>Average hours from PR open to merge, by week merged</p>
            </div>
            {merge_time_trend.some(p => p.value !== null) ? (
              <LineChart data={mergeChartData} color="#22d3ee" height={120} />
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)', padding: '2rem 0', textAlign: 'center' }}>No merged PRs in this range yet.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Dependency links chart — proxy for bottleneck activity */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">New Dependency Links per Week</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>
                Blocking relationships detected between PRs each week. A live blocked-PR count isn't
                tracked historically, so this counts newly-created dependency links instead — a real,
                timestamped signal of bottleneck activity over time.
              </p>
            </div>
            <LineChart data={blockers_trend} color="#f87171" height={120} />
          </div>

          {/* PR creation vs closed bar */}
          <div className="glass" style={{ borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="section-title">PR Volume</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>Created vs. merged/closed pull requests per week</p>
            </div>
            <BarChart data={pr_volume_trend} aKey="created" bKey="closed" aColor="#3b82f6" bColor="#22d3ee" height={120} />
          </div>
        </div>
      </div>
    </div>
  )
}
