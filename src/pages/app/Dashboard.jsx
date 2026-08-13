import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StatCard from '../../components/shared/StatCard'
import { getDashboard } from '../../services/dashboardService'
import { getPRs } from '../../services/prService'
import { useApp } from '../../store/AppContext'

const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { blocked: '#f87171', open: '#60a5fa', merged: '#8b5cf6', closed: '#94a3b8' }

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'var(--text-40)'
  return (
    <span
      className="tag"
      style={{ color, borderColor: `${color}35`, background: `${color}12`, fontSize: '0.6875rem' }}
    >
      {status}
    </span>
  )
}

function formatHours(hours) {
  if (hours === null || hours === undefined) return '—'
  return `${hours}h`
}

function formatDays(days) {
  if (days === null || days === undefined) return '—'
  return `${days}d`
}

export default function Dashboard() {
  const { repos, selectedRepoId } = useApp()

  const [dashboardData, setDashboardData] = useState(null)
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const activeRepo = selectedRepoId !== 'all'
    ? repos.find(r => r.id === Number(selectedRepoId))
    : null

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      getDashboard(),
      getPRs(activeRepo ? activeRepo.id : undefined)
    ])
      .then(([dashboard, prList]) => {
        setDashboardData(dashboard)
        setPrs(prList)
      })
      .catch(err => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [activeRepo])

  const repoNameById = Object.fromEntries(
    repos.map(r => [r.id, `${r.owner}/${r.name}`])
  )

  const criticalPRs = prs.filter(p => p.priority_level === 'Critical')

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Dashboard" subtitle="Real-time engineering workflow intelligence" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Dashboard" subtitle="Real-time engineering workflow intelligence" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader title="Dashboard" subtitle="Real-time engineering workflow intelligence" />

      <div className="page-content">
        {/* Stat Cards */}
        <div className="stats-grid">
          <StatCard
            title="Open Pull Requests"
            value={dashboardData?.total_prs ?? 0}
            color="#3b82f6"
            subtitle={`Across ${dashboardData?.repositories_count ?? 0} connected repos`}
            icon="⬡"
          />
          <StatCard
            title="Critical PRs"
            value={dashboardData?.critical_prs_count ?? 0}
            color="#fbbf24"
            subtitle="Highest priority level"
            icon="▲"
          />
          <StatCard
            title="Blocked PRs"
            value={dashboardData?.blocked_prs_count ?? 0}
            color="#f87171"
            subtitle="Awaiting dependencies"
            icon="◈"
          />
          <StatCard
            title="Repositories"
            value={dashboardData?.repositories_count ?? 0}
            color="#34d399"
            subtitle="Connected to your account"
            icon="◎"
          />
          <StatCard
            title="Avg Review Time"
            value={formatHours(dashboardData?.avg_review_time_hours)}
            color="#22d3ee"
            subtitle="First-review response"
            icon="△"
          />
          <StatCard
            title="Avg Merge Time"
            value={formatDays(dashboardData?.avg_merge_time_days)}
            color="#a855f7"
            subtitle="Creation to merge"
            icon="◼"
          />
        </div>

        <div className="dashboard-grid-2col">
          {/* Critical PRs */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Critical Pull Requests</h2>
              <Link to="/prs" className="section-link">View All →</Link>
            </div>
            {criticalPRs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-40)', fontSize: '0.875rem' }}>
                No critical pull requests right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {criticalPRs.map(pr => (
                  <Link
                    key={pr.id}
                    to={`/prs/${pr.id}`}
                    className="pr-row-card glass-md"
                    style={{ borderColor: `${PRIORITY_COLORS[pr.priority_level]}25` }}
                  >
                    <div
                      className="pr-score-box"
                      style={{
                        background: `${PRIORITY_COLORS[pr.priority_level]}18`,
                        color: PRIORITY_COLORS[pr.priority_level],
                        border: `1px solid ${PRIORITY_COLORS[pr.priority_level]}40`
                      }}
                    >
                      {pr.priority_score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pr-title-line">{pr.title}</div>
                      <div className="pr-meta-line">
                        <span className="tag tag-blue" style={{ fontSize: '0.6rem' }}>
                          {repoNameById[pr.repository_id] || `repo #${pr.repository_id}`}
                        </span>
                        <span style={{ color: 'var(--text-40)', fontSize: '0.6875rem' }}>by {pr.author || 'Unknown'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                      <StatusBadge status={pr.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviewer Load */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Reviewer Load</h2>
              <Link to="/reviewers" className="section-link">All Reviewers →</Link>
            </div>
            {(!dashboardData?.reviewer_load || dashboardData.reviewer_load.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-40)', fontSize: '0.875rem' }}>
                No reviewer data yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {dashboardData.reviewer_load.map((r, i) => (
                  <div
                    key={r.username}
                    className="activity-row"
                    style={{ borderBottom: i < dashboardData.reviewer_load.length - 1 ? '1px solid var(--border-4)' : 'none' }}
                  >
                    <span className="activity-text">{r.username}</span>
                    <span className="activity-time">{r.pending_reviews} pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
