import React, { useEffect, useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { AlertTriangleIcon, BarChartIcon } from '../../components/shared/Icons'
import { getEngineeringAnalytics } from '../../services/analyticsService'
import { useApp } from '../../store/AppContext'

function formatHours(h) {
  if (h === null || h === undefined) return '—'
  return `${h}h`
}

function LineChart({ data = [], color = '#3b82f6', height = 130 }) {
  if (!data.length) return null
  const values = data.map(d => d.value ?? 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 460
  const h = height - 30
  const step = width / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = i * step
    const y = h - (((d.value ?? 0) - min) / range) * (h - 16) - 8
    return { x, y, ...d }
  })

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
  const areaD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${width},${h} L 0,${h} Z`

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke="#060b18" strokeWidth="2" />
            <text x={p.x} y={height - 6} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
              {p.date || p.week || ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function BarChart({ data = [], aKey = 'created', bKey = 'closed', aColor = '#3b82f6', bColor = '#22d3ee', height = 130 }) {
  if (!data.length) return null
  const maxVal = Math.max(...data.flatMap(d => [d[aKey] || 0, d[bKey] || 0]), 1)
  const width = 460
  const h = height - 30
  const barGroupWidth = width / data.length
  const barWidth = Math.min(14, barGroupWidth / 2.6)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {data.map((d, i) => {
          const groupX = i * barGroupWidth + barGroupWidth / 2
          const aH = ((d[aKey] || 0) / maxVal) * (h - 10)
          const bH = ((d[bKey] || 0) / maxVal) * (h - 10)
          return (
            <g key={i}>
              <rect
                x={groupX - barWidth - 1.5}
                y={h - aH}
                width={barWidth}
                height={Math.max(2, aH)}
                rx="2"
                fill={aColor}
                opacity="0.85"
              />
              <rect
                x={groupX + 1.5}
                y={h - bH}
                width={barWidth}
                height={Math.max(2, bH)}
                rx="2"
                fill={bColor}
                opacity="0.85"
              />
              <text x={groupX} y={height - 6} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                {d.week || ''}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
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
    ? `Productivity velocity and turnaround trends for ${activeRepoName}`
    : 'Productivity trends, review turnaround, and throughput velocity'

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
        <DashboardHeader title="Velocity Analytics" subtitle={subtitle} />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Computing Historical Throughput & Bottleneck Velocity...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Compiling cycle time distributions, first-review SLAs, and merge durations.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="app-page">
        <DashboardHeader title="Velocity Analytics" subtitle={subtitle} />
        <div className="page-content">
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <AlertTriangleIcon size={32} color="#f87171" />
            </div>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error || 'No data available'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { summary, review_time_trend, merge_time_trend, blockers_trend, pr_volume_trend } = data

  const chartSafe = (trend) => trend.map(p => ({ ...p, value: p.value ?? 0 }))
  const reviewChartData = chartSafe(review_time_trend)
  const mergeChartData = chartSafe(merge_time_trend)

  const stats = [
    { label: 'Avg Review SLA', value: formatHours(summary.avg_review_time_hours), color: '#60a5fa', sub: 'Target: < 4.0h' },
    { label: 'Avg Merge Turnaround', value: formatHours(summary.avg_merge_time_hours), color: '#22d3ee', sub: 'Creation to master merge' },
    { label: 'PRs Shipped', value: summary.prs_created, color: '#34d399', sub: `During ${range} period` },
    { label: 'Dependency Links', value: summary.blockers_detected, color: '#fbbf24', sub: 'Cross-PR relationships' },
  ]

  return (
    <div className="app-page">
      <DashboardHeader title="Velocity Analytics" subtitle={subtitle} />
      <div className="page-content">

        {/* Time range switcher bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['2W', '4W', '6W', '3M'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`btn btn-ghost ${range === r ? 'btn-ghost-active' : ''}`}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  ...(range === r ? { background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.45)', color: 'var(--cyan-400)' } : {})
                }}
              >
                {r} Window
              </button>
            ))}
          </div>

          <span className="glow-pill" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan-400)', border: '1px solid rgba(34,211,238,0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <BarChartIcon size={12} color="var(--cyan-400)" />
            <span>Telemetry Range: {range}</span>
          </span>
        </div>

        {/* Summary stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.25rem' }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: `${s.color}25` }}>
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color, marginTop: '0.35rem' }}>{s.value}</div>
              <p className="stat-card-subtitle">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Line charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="glass dashboard-section">
            <div className="section-header">
              <div>
                <h3 className="section-title">Review SLA Trend</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>Average hours from PR open to first review</p>
              </div>
            </div>
            {review_time_trend.some(p => p.value !== null) ? (
              <div style={{ padding: '0.5rem 0' }}>
                <LineChart data={reviewChartData} color="#3b82f6" height={130} />
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', padding: '2.5rem 0', textAlign: 'center' }}>No reviewed PRs in this range yet.</p>
            )}
          </div>

          <div className="glass dashboard-section">
            <div className="section-header">
              <div>
                <h3 className="section-title">Merge Turnaround Velocity</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>Average hours from PR open to production merge</p>
              </div>
            </div>
            {merge_time_trend.some(p => p.value !== null) ? (
              <div style={{ padding: '0.5rem 0' }}>
                <LineChart data={mergeChartData} color="#22d3ee" height={130} />
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', padding: '2.5rem 0', textAlign: 'center' }}>No merged PRs in this range yet.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Dependency links chart */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <div>
                <h3 className="section-title">New Dependency Links per Week</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                  Blocking relationships detected across PRs each week
                </p>
              </div>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <LineChart data={blockers_trend} color="#f87171" height={130} />
            </div>
          </div>

          {/* PR creation vs closed bar */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <div>
                <h3 className="section-title">Throughput Volume</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>Created (blue) vs. Closed/Merged (cyan) PRs</p>
              </div>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <BarChart data={pr_volume_trend} aKey="created" bKey="closed" aColor="#3b82f6" bColor="#22d3ee" height={130} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
