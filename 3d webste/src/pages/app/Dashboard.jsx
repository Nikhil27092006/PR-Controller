
import React, { useEffect, useState } from 'react'
import { getDashboard } from '../../services/dashboardService'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StatCard from '../../components/shared/StatCard'
import { getPRs } from '../../services/prService'
import { useApp } from '../../store/AppContext'



const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { Blocked: '#f87171', Reviewing: '#fbbf24', 'In Progress': '#60a5fa', Ready: '#34d399', Merged: '#8b5cf6' }

export default function Dashboard() {
  

  const [dashboardData, setDashboardData] =
    useState(null)
  
  const [prs, setPrs] =
  useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  useEffect(() => {

  getDashboard()
    .then(data => {

      setDashboardData(data)

    })

  getPRs()
    .then(data => {

      setPrs(data)

    })

}, [])

const { repos, selectedRepoId } = useApp()

const activeRepo = repos.find(
  r => r.id === Number(selectedRepoId)
)

const activeRepoName = activeRepo
  ? `${activeRepo.owner}/${activeRepo.name}`
  : null

const scopedPRs = activeRepoName
  ? prs.filter(
      p => p.repo === activeRepoName
    )
  : prs

const criticalPRs =
  scopedPRs.filter(
    p => p.priorityScore >= 85
  )

const blockedPRs =
  scopedPRs.filter(
    p => p.status === "Blocked"
  )

const openPRs =
  scopedPRs.filter(
    p => p.status !== "Merged"
  )

if (loading) {
  return <div>Loading Dashboard...</div>
}

if (error) {
  return <div>{error}</div>
}

return (
  <div className="app-page">
    {/* FULL DASHBOARD UI */}
  </div>
) 

  


 

  const RECENT_ACTIVITY = [
    { icon: '▲', color: '#fbbf24', text: 'PR #4521 flagged as critical — blocking 2 downstream deploys', time: '5m ago', repo: 'vercel/next.js' },
    { icon: '◎', color: '#f87171', text: 'Reviewer Riley Morgan exceeded 97% workload capacity', time: '18m ago', repo: 'vercel/next.js' },
    { icon: '⬡', color: '#60a5fa', text: 'Dependency chain resolved: PR #4489 → #4498 unblocked', time: '1h ago', repo: 'facebook/react' },
    { icon: '⟳', color: '#34d399', text: 'Repository vercel/next.js synced — 34 PRs imported', time: '2h ago', repo: 'vercel/next.js' },
    { icon: '△', color: '#a855f7', text: 'Priority scores recalculated for all open PRs', time: '3h ago', repo: 'fastapi/fastapi' },
  ].filter(act => !activeRepoName || act.repo === activeRepoName)

  return (
    <div className="app-page">
      <DashboardHeader title="Dashboard" subtitle="Real-time engineering workflow intelligence" />

      <div className="page-content">
        {/* Stat Cards */}
        <div className="stats-grid">
          <StatCard title="Open Pull Requests" value={dashboardData?.total_prs || 0} trend="+3 this week" trendDirection="up" color="#3b82f6" subtitle="Across 3 connected repos" icon="⬡" />
          <StatCard title="Critical PRs" value={dashboardData?.critical_prs_count || 0} trend="High urgency" trendDirection="down" color="#fbbf24" subtitle="Score ≥ 85 priority" icon="▲" />
          <StatCard title="Blocked PRs" value={dashboardData?.blocked_prs_count || 0} trend="1 unblocked today" trendDirection="up" color="#f87171" subtitle="Awaiting dependencies" icon="◈" />
          <StatCard title="Repo Health Score" value="74/100" trend="+5 from last week" trendDirection="up" color="#34d399" subtitle="Avg across all repos" icon="◎" />
          <StatCard title="Avg Review Time" value="3.8h" trend="-1.2h improved" trendDirection="up" color="#22d3ee" subtitle="First-review response" icon="△" />
          <StatCard title="Avg Merge Time" value="2.4d" trend="vs 3.1d last week" trendDirection="up" color="#a855f7" subtitle="Creation to merge" icon="◼" />
        </div>

        <div className="dashboard-grid-2col">
          {/* Critical PRs */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Critical Pull Requests</h2>
              <Link to="/prs" className="section-link">View All →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {criticalPRs.map(pr => (
                <Link key={pr.id} to={`/prs/${pr.id}`} className="pr-row-card glass-md" style={{ borderColor: `${PRIORITY_COLORS[pr.priority]}25` }}>
                  <div className="pr-score-box" style={{ background: `${PRIORITY_COLORS[pr.priority]}18`, color: PRIORITY_COLORS[pr.priority], border: `1px solid ${PRIORITY_COLORS[pr.priority]}40` }}>
                    {pr.priorityScore}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pr-title-line">{pr.title}</div>
                    <div className="pr-meta-line">
                      <span className="tag tag-blue" style={{ fontSize: '0.6rem' }}>{pr.repo}</span>
                      <span style={{ color: 'var(--text-40)', fontSize: '0.6875rem' }}>by {pr.author}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                    <StatusBadge s={pr.status} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-40)' }}>{pr.age}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Recent Activity</h2>
              <Link to="/alerts" className="section-link">All Alerts →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="activity-row" style={{ borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid var(--border-4)' : 'none' }}>
                  <span className="activity-icon" style={{ color: a.color }}>{a.icon}</span>
                  <span className="activity-text">{a.text}</span>
                  <span className="activity-time">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Health Summary */}
        <div className="glass dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Workflow Health Summary</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Reviewer Load Balance', score: 62, color: '#fbbf24', note: '2 reviewers overloaded' },
              { label: 'Merge Velocity', score: 84, color: '#34d399', note: 'Above average this week' },
              { label: 'Dependency Health', score: 51, color: '#f87171', note: '4-node chain detected' },
              { label: 'CI/CD Stability', score: 91, color: '#22d3ee', note: '< 5% failure rate' },
            ].map((h, i) => (
              <div key={i} className="glass-md" style={{ borderRadius: 12, padding: '1.125rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '0.625rem' }}>{h.label}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: h.color, lineHeight: 1 }}>{h.score}</span>
                  <span style={{ color: 'var(--text-40)', fontSize: '0.875rem', paddingBottom: '0.1rem' }}>/100</span>
                </div>
                <div style={{ height: 3, background: 'var(--border-4)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${h.score}%`, background: h.color, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', marginTop: '0.5rem' }}>{h.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
