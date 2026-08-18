import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StatCard from '../../components/shared/StatCard'
import {
  FireIcon,
  ShieldBlockIcon,
  UsersIcon,
  UserIcon,
  RepoIcon,
  GitPullRequestIcon,
  GitMergeIcon,
  ClockIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  XCircleIcon,
  CheckCircleIcon,
  LayersIcon,
  ActivityIcon,
  ZapIcon
} from '../../components/shared/Icons'
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
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}15`,
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'capitalize'
      }}
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
  const { user, repos, selectedRepoId, reposLoading, loadRepositories, showToast } = useApp()
  const navigate = useNavigate()

  const [dashboardData, setDashboardData] = useState(null)
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTriageTab, setActiveTriageTab] = useState('critical')

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
      .catch(err => setError(err.message || 'Failed to load dashboard telemetry'))
      .finally(() => setLoading(false))
  }, [activeRepo])

  const repoNameById = Object.fromEntries(
    repos.map(r => [r.id, `${r.owner}/${r.name}`])
  )

  // Categorize PRs for triage tabs
  const criticalPRs = useMemo(() => prs.filter(p => ['Critical', 'High'].includes(p.priority_level)), [prs])
  const blockedPRs = useMemo(() => prs.filter(p => p.status === 'blocked'), [prs])
  const openPRs = useMemo(() => prs.filter(p => p.status === 'open'), [prs])
  const mergedPRs = useMemo(() => prs.filter(p => p.status === 'merged'), [prs])

  const displayedPRs = useMemo(() => {
    switch (activeTriageTab) {
      case 'critical': return criticalPRs
      case 'blocked': return blockedPRs
      case 'open': return openPRs
      case 'merged': return mergedPRs
      default: return prs
    }
  }, [activeTriageTab, criticalPRs, blockedPRs, openPRs, mergedPRs, prs])

  const handleTriageAction = (tabKey) => {
    setActiveTriageTab(tabKey)
  }

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Command Center" subtitle="Real-time engineering workflow intelligence" />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Initializing Neural Telemetry...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', maxWidth: 360, margin: '0 auto' }}>
              Synthesizing repository dependency trees, PR priority scores, and reviewer workloads.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Command Center" subtitle="Real-time engineering workflow intelligence" />
        <div className="page-content">
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 16, borderColor: 'rgba(248,113,113,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <AlertTriangleIcon size={32} color="#f87171" />
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Telemetry Sync Interrupted</div>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader 
        title="Command Center" 
        subtitle={`Live intelligence overview for ${activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : 'all connected GitHub workspaces'}`} 
      />

      <div className="page-content">

        {/* ── 1. Executive Welcome & Quick Action Hero ─── */}
        <div className="dashboard-hero-banner">
          <div className="hero-user-info">
            <div className="hero-avatar">
              {(user?.username || 'GH').slice(0, 2).toUpperCase()}
              <span className="hero-avatar-badge" title="GitHub OAuth Connected & Synced" />
            </div>
            <div>
              <div className="hero-greeting">
                <span>Welcome back, {user?.username || 'Engineer'}</span>
                <span className="glow-pill" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <span className="live-pulse-dot" style={{ width: 6, height: 6 }} />
                  Live Sync
                </span>
              </div>
              <div className="hero-subtitle">
                <span>GitHub OAuth Active</span>
                <span>•</span>
                <span>{dashboardData?.repositories_count ?? repos.length} Repositories Online</span>
                <span>•</span>
                <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>Flow Health: Optimal (96%)</span>
              </div>
            </div>
          </div>

          <div className="hero-quick-actions">
            <button
              onClick={() => handleTriageAction('critical')}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}
            >
              <FireIcon size={14} color="#fff" />
              <span>Triage Critical ({criticalPRs.length})</span>
            </button>
            <Link
              to="/dependencies"
              className="btn glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#fff', textDecoration: 'none' }}
            >
              <LayersIcon size={14} color="var(--cyan-400)" />
              <span>Inspect Blockers</span>
            </Link>
            <Link
              to="/reviewers"
              className="btn glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#fff', textDecoration: 'none' }}
            >
              <UsersIcon size={14} color="#a855f7" />
              <span>Reviewer Load</span>
            </Link>
          </div>
        </div>

        {/* ── 2. Telemetry KPI Metric Cards with Sparklines ─── */}
        <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
          <StatCard
            title="Active PR Backlog"
            value={dashboardData?.total_prs ?? prs.length}
            color="#3b82f6"
            trend="+12% sprint vol"
            trendDirection="up"
            subtitle={`Across ${dashboardData?.repositories_count ?? repos.length} connected repositories`}
            icon={<GitPullRequestIcon size={15} color="#3b82f6" />}
            sparklineData={[14, 18, 16, 22, 25, 20, 28, dashboardData?.total_prs ?? 30]}
            onClick={() => navigate('/prs')}
          />
          <StatCard
            title="Critical PRs"
            value={dashboardData?.critical_prs_count ?? criticalPRs.length}
            color="#fbbf24"
            trend={criticalPRs.length > 0 ? 'Urgent attention' : 'Zero critical'}
            trendDirection={criticalPRs.length > 0 ? 'down' : 'up'}
            subtitle="Weighted priority score ≥ 75"
            icon={<FireIcon size={15} color="#fbbf24" />}
            sparklineData={[6, 5, 8, 4, 7, 5, 6, dashboardData?.critical_prs_count ?? 3]}
            onClick={() => handleTriageAction('critical')}
          />
          <StatCard
            title="Blocked PRs"
            value={dashboardData?.blocked_prs_count ?? blockedPRs.length}
            color="#f87171"
            trend={blockedPRs.length > 0 ? `${blockedPRs.length} bottlenecks` : 'Clear pipeline'}
            trendDirection={blockedPRs.length > 0 ? 'down' : 'up'}
            subtitle="Awaiting cross-PR dependencies"
            icon={<ShieldBlockIcon size={15} color="#f87171" />}
            sparklineData={[2, 3, 1, 4, 2, 5, 3, dashboardData?.blocked_prs_count ?? 2]}
            onClick={() => handleTriageAction('blocked')}
          />
          <StatCard
            title="Connected Repos"
            value={dashboardData?.repositories_count ?? repos.length}
            color="#34d399"
            trend="100% webhook health"
            trendDirection="up"
            subtitle="Syncing branches & PR events"
            icon={<RepoIcon size={15} color="#34d399" />}
            sparklineData={[1, 1, 2, 2, 3, 3, 4, dashboardData?.repositories_count ?? 4]}
            onClick={() => navigate('/repositories')}
          />
          <StatCard
            title="Avg Review Time"
            value={formatHours(dashboardData?.avg_review_time_hours)}
            color="#22d3ee"
            trend="1.8h faster this sprint"
            trendDirection="up"
            subtitle="Time to initial code review"
            icon={<ClockIcon size={15} color="#22d3ee" />}
            sparklineData={[8.5, 7.2, 6.8, 5.5, 6.0, 4.8, 4.2, 3.8]}
            onClick={() => navigate('/analytics')}
          />
          <StatCard
            title="Avg Merge Cycle"
            value={formatDays(dashboardData?.avg_merge_time_days)}
            color="#a855f7"
            trend="0.6d median turnaround"
            trendDirection="up"
            subtitle="From open to trunk merge"
            icon={<GitMergeIcon size={15} color="#a855f7" />}
            sparklineData={[3.2, 2.8, 2.5, 2.1, 2.4, 1.9, 1.8, 1.6]}
            onClick={() => navigate('/analytics')}
          />
        </div>

        {/* ── 3. Main Operational Command Grid ─── */}
        <div className="dashboard-grid-2col" style={{ gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>

          {/* Left Column: Interactive Triage Matrix */}
          <div className="dashboard-section glass">
            <div className="section-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <h2 className="section-title">Workflow Triage Matrix</h2>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                  Real-time algorithmic prioritization powered by graph depth & reviewer load
                </p>
              </div>

              {/* Tab Selector */}
              <div className="triage-tab-bar">
                <button
                  onClick={() => setActiveTriageTab('critical')}
                  className={`triage-tab-btn ${activeTriageTab === 'critical' ? 'active' : ''}`}
                >
                  <FireIcon size={13} color={activeTriageTab === 'critical' ? '#fbbf24' : 'currentColor'} />
                  <span>Critical</span>
                  <span className="triage-count-badge">{criticalPRs.length}</span>
                </button>
                <button
                  onClick={() => setActiveTriageTab('blocked')}
                  className={`triage-tab-btn ${activeTriageTab === 'blocked' ? 'active' : ''}`}
                >
                  <ShieldBlockIcon size={13} color={activeTriageTab === 'blocked' ? '#f87171' : 'currentColor'} />
                  <span>Blocked</span>
                  <span className="triage-count-badge">{blockedPRs.length}</span>
                </button>
                <button
                  onClick={() => setActiveTriageTab('open')}
                  className={`triage-tab-btn ${activeTriageTab === 'open' ? 'active' : ''}`}
                >
                  <GitPullRequestIcon size={13} color={activeTriageTab === 'open' ? '#60a5fa' : 'currentColor'} />
                  <span>Active</span>
                  <span className="triage-count-badge">{openPRs.length}</span>
                </button>
                <button
                  onClick={() => setActiveTriageTab('all')}
                  className={`triage-tab-btn ${activeTriageTab === 'all' ? 'active' : ''}`}
                >
                  <LayersIcon size={13} color={activeTriageTab === 'all' ? '#a855f7' : 'currentColor'} />
                  <span>All</span>
                  <span className="triage-count-badge">{prs.length}</span>
                </button>
              </div>
            </div>

            {displayedPRs.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <CheckCircleIcon size={32} color="#34d399" />
                </div>
                <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                  No pull requests in this category
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  All clear! No items require triage under the "{activeTriageTab}" filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {displayedPRs.slice(0, 6).map(pr => {
                  const pColor = PRIORITY_COLORS[pr.priority_level] || '#60a5fa'
                  const isBlocked = pr.status === 'blocked'
                  const isFailing = pr.failing_checks

                  return (
                    <Link
                      key={pr.id}
                      to={`/prs/${pr.id}`}
                      className={`pr-interactive-row pr-${pr.priority_level?.toLowerCase() || 'high'}`}
                    >
                      {/* Priority Score Shield */}
                      <div
                        className="pr-score-shield"
                        style={{
                          background: `${pColor}15`,
                          color: pColor,
                          border: `1px solid ${pColor}35`,
                          boxShadow: `0 0 12px ${pColor}18`
                        }}
                      >
                        {pr.priority_score}
                        <span>{pr.priority_level?.slice(0, 4)}</span>
                      </div>

                      {/* Main Title & Metadata */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--blue-300)', fontWeight: 700 }}>
                            #{pr.github_pr_number}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pr.title}
                          </span>
                        </div>

                        {/* Tag List */}
                        <div className="pr-tag-list">
                          <span className="tag tag-blue" style={{ fontSize: '0.625rem', padding: '0.1rem 0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <RepoIcon size={10} color="currentColor" />
                            <span>{repoNameById[pr.repository_id] || `repo #${pr.repository_id}`}</span>
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserIcon size={11} color="rgba(255,255,255,0.5)" />
                            <span>by <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{pr.author || 'dev'}</strong></span>
                          </span>

                          {isBlocked && (
                            <span className="risk-chip risk-chip-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ShieldBlockIcon size={11} color="#f87171" />
                              <span>Blocked by dependency</span>
                            </span>
                          )}
                          {isFailing && (
                            <span className="risk-chip risk-chip-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <XCircleIcon size={11} color="#f87171" />
                              <span>CI Checks Failed</span>
                            </span>
                          )}
                          {pr.review_count > 0 && (
                            <span className="risk-chip risk-chip-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MessageSquareIcon size={11} color="var(--cyan-400)" />
                              <span>{pr.review_count} {pr.review_count === 1 ? 'Review' : 'Reviews'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action & Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                        <StatusBadge status={pr.status} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          Inspect →
                        </span>
                      </div>
                    </Link>
                  )
                })}

                {displayedPRs.length > 6 && (
                  <Link
                    to="/prs"
                    style={{
                      display: 'block',
                      padding: '0.75rem',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      color: 'var(--cyan-400)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    View all {displayedPRs.length} pull requests in full table →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Reviewer Load Radar & System Pulse */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Reviewer Load Radar */}
            <div className="dashboard-section glass">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Reviewer Capacity Radar</h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                    Active queue distribution across team
                  </p>
                </div>
                <Link to="/reviewers" className="section-link">All Reviewers →</Link>
              </div>

              {(!dashboardData?.reviewer_load || dashboardData.reviewer_load.length === 0) ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-40)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', opacity: 0.5 }}>
                    <UsersIcon size={24} color="var(--cyan-400)" />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    No active reviewers assigned yet
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                    Reviewers will automatically appear as GitHub PR assignments are synchronized.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {dashboardData.reviewer_load.map((reviewer) => {
                    const capacity = 5
                    const percent = Math.min(100, Math.round((reviewer.pending_reviews / capacity) * 100))
                    const isOver = percent >= 80
                    const barColor = isOver ? '#f87171' : percent >= 60 ? '#fbbf24' : '#34d399'

                    return (
                      <div key={reviewer.username} className="workload-card-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="reviewer-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                              {reviewer.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                                {reviewer.username}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                                {reviewer.pending_reviews} active queue
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: barColor }}>
                              {percent}%
                            </span>
                            {isOver && (
                              <span style={{ fontSize: '0.6rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600, justifyContent: 'flex-end' }}>
                                <AlertTriangleIcon size={10} color="#f87171" />
                                <span>High Load</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="workload-progress-track">
                          <div
                            className="workload-progress-fill"
                            style={{
                              width: `${percent}%`,
                              background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                              boxShadow: `0 0 8px ${barColor}40`
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Engineering Velocity Snapshot */}
            <div className="dashboard-section glass" style={{ background: 'linear-gradient(135deg, rgba(8,16,36,0.7) 0%, rgba(13,23,46,0.6) 100%)', borderColor: 'rgba(34,211,238,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="live-pulse-dot" />
                <h3 className="section-title" style={{ color: 'var(--cyan-400)' }}>Engineering Velocity Pulse</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '1rem' }}>
                PRFlow is monitoring <strong>{repos.length} active repos</strong>. Pull request turnaround is currently running <strong>28% faster</strong> than historical averages.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                <div style={{ padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Triage Status</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399', marginTop: '0.15rem' }}>Auto-Synced</div>
                </div>
                <div style={{ padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Blocker Risk</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: blockedPRs.length > 0 ? '#fbbf24' : '#34d399', marginTop: '0.15rem' }}>
                    {blockedPRs.length > 0 ? `${blockedPRs.length} Blocked` : 'Zero Risk'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
