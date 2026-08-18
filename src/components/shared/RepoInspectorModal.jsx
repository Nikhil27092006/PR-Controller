import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRepositoryDetail, syncRepository } from '../../services/repositoryService'
import { useApp } from '../../store/AppContext'
import {
  FireIcon,
  ShieldBlockIcon,
  UsersIcon,
  UserIcon,
  RepoIcon,
  GitPullRequestIcon,
  ClockIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  XCircleIcon,
  CheckCircleIcon,
  LayersIcon,
  BarChartIcon,
  ZapIcon,
  SearchIcon,
  InboxIcon
} from './Icons'

const PRIORITY_COLORS = {
  Critical: '#fbbf24',
  High: '#60a5fa',
  Medium: '#a855f7',
  Low: '#34d399'
}

const STATUS_COLORS = {
  blocked: '#f87171',
  open: '#60a5fa',
  merged: '#a855f7',
  closed: '#94a3b8'
}

const HEALTH_COLORS = {
  'A+': '#34d399',
  'A': '#22d3ee',
  'B': '#60a5fa',
  'C': '#fbbf24',
  'D': '#f87171'
}

function timeAgo(isoDate) {
  if (!isoDate) return 'Recently'
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export default function RepoInspectorModal({ repo, isOpen, onClose, onRepoUpdated }) {
  const { setSelectedRepoId, showToast, loadRepositories } = useApp()
  const navigate = useNavigate()

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [prFilter, setPrFilter] = useState('all')
  const [prSearch, setPrSearch] = useState('')

  const fetchDetail = async () => {
    if (!repo) return
    setLoading(true)
    setError(null)
    try {
      const data = await getRepositoryDetail(repo.id)
      setDetail(data)
    } catch (err) {
      setError(err.message || 'Failed to load repository telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && repo) {
      fetchDetail()
      setActiveTab('overview')
      setPrFilter('all')
      setPrSearch('')
    }
  }, [isOpen, repo?.id])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSync = async () => {
    if (!repo) return
    setSyncing(true)
    showToast(`Synchronizing & analyzing ${repo.full_name || repo.name}...`, 'info')
    try {
      const updated = await syncRepository(repo.id)
      setDetail(updated)
      showToast(`Successfully refreshed ${repo.name}`, 'success')
      if (onRepoUpdated) onRepoUpdated()
      loadRepositories()
    } catch (err) {
      showToast(err.message || 'Failed to sync repository', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleFocusInDashboard = () => {
    setSelectedRepoId(String(repo.id))
    onClose()
    navigate('/dashboard')
    showToast(`Dashboard filtered to ${repo.name}`, 'info')
  }

  const handleFocusInPRs = () => {
    setSelectedRepoId(String(repo.id))
    onClose()
    navigate('/prs')
    showToast(`PR List filtered to ${repo.name}`, 'info')
  }

  const filteredPRs = useMemo(() => {
    if (!detail?.pull_requests) return []
    let list = detail.pull_requests

    if (prFilter === 'critical') {
      list = list.filter(p => ['Critical', 'High'].includes(p.priority_level))
    } else if (prFilter === 'blocked') {
      list = list.filter(p => p.status === 'blocked' || p.is_blocking || p.merge_conflict)
    } else if (prFilter === 'open') {
      list = list.filter(p => p.status === 'open')
    } else if (prFilter === 'merged') {
      list = list.filter(p => p.status === 'merged')
    }

    if (prSearch.trim()) {
      const q = prSearch.toLowerCase().trim()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        String(p.github_pr_number).includes(q) ||
        (p.author && p.author.toLowerCase().includes(q))
      )
    }

    return list
  }, [detail?.pull_requests, prFilter, prSearch])

  if (!isOpen || !repo) return null

  const healthColor = detail?.health_grade ? HEALTH_COLORS[detail.health_grade] || '#34d399' : '#34d399'

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 4, 7, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: '1040px',
          maxHeight: '92vh',
          backgroundColor: 'rgba(5, 10, 22, 0.97)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.12)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Top Header ─── */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            background: 'linear-gradient(90deg, rgba(14, 23, 47, 0.7) 0%, rgba(8, 14, 28, 0.4) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <RepoIcon size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {repo.owner}/<span style={{ color: '#38bdf8' }}>{repo.name}</span>
                </h2>
                <span className="tag tag-blue" style={{ fontSize: '0.6875rem' }}>
                  Branch: {detail?.default_branch || repo.default_branch || 'main'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.6875rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 9999,
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  Live Monitored
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.2rem', marginBottom: 0 }}>
                {detail?.description || repo.description || 'Monitored repository with active automated PR triage and telemetry.'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '0.45rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'rgba(56, 189, 248, 0.3)',
                color: '#38bdf8'
              }}
              title="Synchronize and re-analyze pull requests from GitHub"
            >
              <svg
                className={syncing ? 'icon-spin' : ''}
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {syncing ? 'Analyzing...' : 'Re-Sync Repo'}
            </button>

            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '0.45rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <span>GitHub</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>

            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: 34,
                height: 34,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer'
              }}
              aria-label="Close inspector"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ─── */}
        <div
          style={{
            padding: '0 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '1.5rem',
            background: 'rgba(2, 5, 12, 0.6)'
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Health Score', icon: <BarChartIcon size={14} color="currentColor" /> },
            { id: 'prs', label: `Pull Requests (${detail?.pull_requests?.length ?? '...'})`, icon: <GitPullRequestIcon size={14} color="currentColor" /> },
            { id: 'reviewers', label: `Reviewers (${detail?.reviewers?.length ?? 0})`, icon: <UsersIcon size={14} color="currentColor" /> },
            { id: 'alerts', label: `Alerts & Bottlenecks (${detail?.alerts?.length ?? 0})`, icon: <AlertTriangleIcon size={14} color="currentColor" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                padding: '0.875rem 0.25rem',
                color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Modal Scrollable Body ─── */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {loading && !detail ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="live-pulse-dot" style={{ margin: '0 auto 1.25rem', width: 14, height: 14 }} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>
                Inspecting Codebase Telemetry...
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Evaluating priority weight factors, reviewer queues, and conflict rates for {repo.name}.
              </p>
            </div>
          ) : error ? (
            <div className="glass" style={{ borderRadius: 12, padding: '2.5rem', textAlign: 'center', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <AlertTriangleIcon size={32} color="#f87171" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Failed to inspect repository
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                {error}
              </p>
              <button onClick={fetchDetail} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                Retry Telemetry Fetch
              </button>
            </div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: OVERVIEW & HEALTH SCORE
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div>
                  {/* Top Highlight: Health Score + Fast Launch Actions */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                      gap: '1.25rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {/* Repository Health Score Card */}
                    <div
                      className="glass"
                      style={{
                        borderRadius: 14,
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(8, 16, 32, 0.9) 0%, rgba(14, 25, 52, 0.7) 100%)',
                        border: `1px solid ${healthColor}35`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: healthColor }} />
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>
                            Health Index
                          </span>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: 6,
                              background: `${healthColor}20`,
                              border: `1px solid ${healthColor}50`,
                              color: healthColor,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            Grade: {detail.health_grade}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.85rem' }}>
                          <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', lineHeight: 1 }}>
                            {detail.health_score}
                          </div>
                          <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>/ 100</div>
                        </div>

                        <div style={{ marginTop: '0.5rem', color: healthColor, fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor }} />
                          <span>{detail.health_status}</span>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                          {detail.blocked_prs === 0 && detail.merge_conflicts_count === 0
                            ? 'Zero active bottlenecks or merge conflicts detected in this repository.'
                            : `${detail.blocked_prs} blocked PR(s) and ${detail.merge_conflicts_count} merge conflict(s) requiring review attention.`}
                        </p>
                      </div>

                      <div style={{ paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>
                        <span>Last Synced:</span>
                        <span>{timeAgo(detail.last_synced_at || detail.created_at)}</span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(96, 165, 250, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="stat-card-title">Active Pull Requests</h3>
                          <GitPullRequestIcon size={14} color="#60a5fa" />
                        </div>
                        <div className="stat-card-value" style={{ color: '#60a5fa', marginTop: '0.25rem' }}>
                          {detail.open_prs} <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ {detail.total_prs} total</span>
                        </div>
                        <p className="stat-card-subtitle">{detail.merged_prs} merged ({detail.merge_rate_pct}% velocity)</p>
                      </div>

                      <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(251, 191, 36, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="stat-card-title">Priority Triage</h3>
                          <FireIcon size={14} color="#fbbf24" />
                        </div>
                        <div className="stat-card-value" style={{ color: '#fbbf24', marginTop: '0.25rem' }}>
                          {detail.critical_prs} <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>CRITICAL</span>
                        </div>
                        <p className="stat-card-subtitle">{detail.high_prs} High • {detail.medium_prs} Med • {detail.low_prs} Low</p>
                      </div>

                      <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(248, 113, 113, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="stat-card-title">Bottlenecks & CI</h3>
                          <ShieldBlockIcon size={14} color={(detail.blocked_prs + detail.merge_conflicts_count > 0) ? '#f87171' : '#34d399'} />
                        </div>
                        <div className="stat-card-value" style={{ color: (detail.blocked_prs + detail.merge_conflicts_count > 0) ? '#f87171' : '#34d399', marginTop: '0.25rem' }}>
                          {detail.blocked_prs + detail.merge_conflicts_count}
                        </div>
                        <p className="stat-card-subtitle">{detail.merge_conflicts_count} Conflicts • {detail.failing_checks_count} CI fails</p>
                      </div>

                      <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(168, 85, 247, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="stat-card-title">Turnaround Speed</h3>
                          <ClockIcon size={14} color="#a855f7" />
                        </div>
                        <div className="stat-card-value" style={{ color: '#a855f7', marginTop: '0.25rem' }}>
                          {detail.avg_turnaround_hours ? `${detail.avg_turnaround_hours}h` : '—'}
                        </div>
                        <p className="stat-card-subtitle">{detail.reviewers?.length || 0} active assignees</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Command Bar */}
                  <div
                    className="glass"
                    style={{
                      borderRadius: 12,
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      marginBottom: '1.5rem',
                      borderColor: 'rgba(56, 189, 248, 0.2)',
                      background: 'rgba(8, 16, 32, 0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                        Deep Dive Into This Codebase
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleFocusInDashboard}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <ZapIcon size={13} color="#fff" />
                        <span>Focus Command Center</span>
                      </button>
                      <button
                        onClick={handleFocusInPRs}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <GitPullRequestIcon size={13} color="#60a5fa" />
                        <span>Filter Pull Requests</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose()
                          navigate('/dependencies')
                        }}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <LayersIcon size={13} color="var(--cyan-400)" />
                        <span>View Dependency Graph</span>
                      </button>
                    </div>
                  </div>

                  {/* Priority Pull Requests Preview in this repo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
                        Top Priority PRs in {repo.name}
                      </h4>
                      <button
                        onClick={() => setActiveTab('prs')}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                      >
                        View all {detail.pull_requests?.length} PRs →
                      </button>
                    </div>

                    {detail.pull_requests?.length === 0 ? (
                      <div className="glass" style={{ borderRadius: 12, padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', border: '1px dashed rgba(56, 189, 248, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                          <InboxIcon size={32} color="rgba(255,255,255,0.4)" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          No Pull Requests Found on GitHub
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto 1rem' }}>
                          PRFlow analyzes Pull Requests to calculate priority scores, detect merge conflicts, track reviewer capacity, and build dependency graphs. Create a PR on GitHub to see live telemetry.
                        </p>
                        <a
                          href={`https://github.com/${repo.owner}/${repo.name}/pulls`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <span>+ Create PR on GitHub</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {detail.pull_requests.slice(0, 4).map(pr => {
                          const pColor = PRIORITY_COLORS[pr.priority_level] || '#60a5fa'
                          const sColor = STATUS_COLORS[pr.status] || '#60a5fa'
                          return (
                            <div
                              key={pr.id}
                              className="glass"
                              style={{
                                borderRadius: 10,
                                padding: '0.875rem 1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                borderColor: `${pColor}25`,
                                background: 'rgba(10, 18, 36, 0.6)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 6,
                                    background: `${pColor}18`,
                                    border: `1px solid ${pColor}40`,
                                    color: pColor,
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    flexShrink: 0
                                  }}
                                >
                                  {pr.priority_level} ({pr.priority_score})
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                                      #{pr.github_pr_number}
                                    </span>
                                    <Link
                                      to={`/prs/${pr.id}`}
                                      onClick={onClose}
                                      style={{
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {pr.title}
                                    </Link>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                                    by @{pr.author || 'unknown'} • {timeAgo(pr.created_at)}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                {pr.merge_conflict && (
                                  <span className="tag" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <AlertTriangleIcon size={10} color="#f87171" />
                                    <span>Conflict</span>
                                  </span>
                                )}
                                <span
                                  className="tag"
                                  style={{
                                    color: sColor,
                                    borderColor: `${sColor}40`,
                                    background: `${sColor}15`,
                                    fontSize: '0.6875rem',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {pr.status}
                                </span>
                                <Link
                                  to={`/prs/${pr.id}`}
                                  onClick={onClose}
                                  className="btn btn-ghost"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#38bdf8' }}
                                >
                                  Inspect PR →
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: PULL REQUESTS TRIAGE
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'prs' && (
                <div>
                  {/* PR Search and Filter Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'All PRs' },
                        { id: 'critical', label: 'Critical / High' },
                        { id: 'blocked', label: 'Blocked / Conflicts' },
                        { id: 'open', label: 'Open Only' },
                        { id: 'merged', label: 'Merged' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setPrFilter(f.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: prFilter === f.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: prFilter === f.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.6)',
                            border: prFilter === f.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative', width: 220 }}>
                      <input
                        type="text"
                        placeholder="Search PRs in repo..."
                        value={prSearch}
                        onChange={e => setPrSearch(e.target.value)}
                        className="form-input"
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.75rem',
                          color: '#fff'
                        }}
                      />
                    </div>
                  </div>

                  {/* PR List */}
                  {detail.pull_requests?.length === 0 ? (
                    <div className="glass" style={{ borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', border: '1px dashed rgba(56, 189, 248, 0.25)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <InboxIcon size={40} color="rgba(255,255,255,0.4)" />
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        No Pull Requests Found in this Repository
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.45)', maxWidth: 500, margin: '0 auto 1.25rem' }}>
                        GitHub reports 0 pull requests for {repo.owner}/{repo.name}. Create a PR by branching and pushing code to GitHub to trigger automated priority scoring and dependency mapping.
                      </p>
                      <a
                        href={`https://github.com/${repo.owner}/${repo.name}/pulls`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <span>+ Open New PR on GitHub</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      </a>
                    </div>
                  ) : filteredPRs.length === 0 ? (
                    <div className="glass" style={{ borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <SearchIcon size={32} color="rgba(255,255,255,0.4)" />
                      </div>
                      <div>No pull requests match the selected filter.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredPRs.map(pr => {
                        const pColor = PRIORITY_COLORS[pr.priority_level] || '#60a5fa'
                        const sColor = STATUS_COLORS[pr.status] || '#60a5fa'
                        return (
                          <div
                            key={pr.id}
                            className="glass"
                            style={{
                              borderRadius: 12,
                              padding: '1rem 1.25rem',
                              borderLeft: `3px solid ${pColor}`,
                              background: 'rgba(10, 18, 36, 0.65)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                    #{pr.github_pr_number}
                                  </span>
                                  <Link
                                    to={`/prs/${pr.id}`}
                                    onClick={onClose}
                                    style={{
                                      color: '#fff',
                                      fontSize: '0.95rem',
                                      fontWeight: 600,
                                      textDecoration: 'none'
                                    }}
                                  >
                                    {pr.title}
                                  </Link>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <UserIcon size={11} color="rgba(255,255,255,0.4)" />
                                  <span>Opened by <strong style={{ color: '#fff' }}>@{pr.author || 'unknown'}</strong> • {timeAgo(pr.created_at)}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 6,
                                    background: `${pColor}20`,
                                    border: `1px solid ${pColor}50`,
                                    color: pColor,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
                                  {pr.priority_level} ({pr.priority_score})
                                </span>
                                <span
                                  className="tag"
                                  style={{
                                    color: sColor,
                                    borderColor: `${sColor}40`,
                                    background: `${sColor}15`,
                                    fontSize: '0.7rem',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {pr.status}
                                </span>
                                <Link
                                  to={`/prs/${pr.id}`}
                                  onClick={onClose}
                                  className="btn btn-ghost"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#38bdf8' }}
                                >
                                  Inspect →
                                </Link>
                              </div>
                            </div>

                            {/* Tags row */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
                              {pr.merge_conflict && (
                                <span className="tag" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertTriangleIcon size={10} color="#f87171" />
                                  <span>Merge Conflict</span>
                                </span>
                              )}
                              {pr.failing_checks && (
                                <span className="tag" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', fontSize: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <XCircleIcon size={10} color="#fbbf24" />
                                  <span>CI Checks Failing</span>
                                </span>
                              )}
                              {pr.is_blocking && (
                                <span className="tag" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <ShieldBlockIcon size={10} color="#f87171" />
                                  <span>Blocking Dependencies</span>
                                </span>
                              )}
                              {pr.priority_breakdown?.slice(0, 2).map((factor, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.625rem',
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: 4,
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
                                  {factor.factor}: +{factor.score}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: REVIEWERS ALLOCATION
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'reviewers' && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
                      Assigned Reviewers for {repo.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.15rem' }}>
                      Reviewer workload distribution and queue status across pull requests in this repository.
                    </p>
                  </div>

                  {detail.reviewers?.length === 0 ? (
                    <div className="glass" style={{ borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <UsersIcon size={32} color="rgba(255,255,255,0.4)" />
                      </div>
                      <div>No reviewers are currently assigned to pull requests in this repository.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {detail.reviewers.map(rev => {
                        const cap = rev.capacity || 5
                        const assigned = rev.assigned_count || 0
                        const loadPct = Math.min(100, Math.round((assigned / cap) * 100))
                        const isOverloaded = assigned > cap

                        return (
                          <div
                            key={rev.id}
                            className="glass"
                            style={{
                              borderRadius: 12,
                              padding: '1.125rem 1.25rem',
                              borderColor: isOverloaded ? 'rgba(248, 113, 113, 0.35)' : 'rgba(56, 189, 248, 0.2)',
                              background: 'rgba(10, 18, 36, 0.7)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                                    color: '#000',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8125rem'
                                  }}
                                >
                                  {rev.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                                    @{rev.username}
                                  </div>
                                  <span style={{ fontSize: '0.6875rem', color: isOverloaded ? '#f87171' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    {isOverloaded && <AlertTriangleIcon size={10} color="#f87171" />}
                                    <span>{isOverloaded ? 'Overloaded' : 'Optimal Capacity'}</span>
                                  </span>
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  color: isOverloaded ? '#f87171' : '#38bdf8'
                                }}
                              >
                                {assigned} / {cap} PRs
                              </span>
                            </div>

                            {/* Workload Progress Bar */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: '0.75rem' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${loadPct}%`,
                                  background: isOverloaded ? '#f87171' : '#38bdf8',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono)' }}>
                              <span>Total Pending: {rev.pending_reviews}</span>
                              <span>Completed: {rev.completed_reviews}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: ALERTS & BOTTLENECKS
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'alerts' && (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
                      Active Alerts & Incidents for {repo.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.15rem' }}>
                      Automated triage warnings, merge conflicts, blocking dependencies, and reviewer stalls.
                    </p>
                  </div>

                  {detail.alerts?.length === 0 ? (
                    <div className="glass" style={{ borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <CheckCircleIcon size={32} color="#34d399" />
                      </div>
                      <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>All Clear!</div>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        No unresolved incident alerts or blocked dependencies for this repository.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {detail.alerts.map(alert => {
                        const sevColor = alert.severity === 'critical' ? '#f87171' : alert.severity === 'warning' ? '#fbbf24' : '#60a5fa'
                        return (
                          <div
                            key={alert.id}
                            className="glass"
                            style={{
                              borderRadius: 10,
                              padding: '0.875rem 1.125rem',
                              borderLeft: `3px solid ${sevColor}`,
                              background: 'rgba(10, 18, 36, 0.7)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '1rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: sevColor,
                                    background: `${sevColor}15`,
                                    border: `1px solid ${sevColor}35`,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 4,
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
                                  {alert.severity}
                                </span>
                                <strong style={{ color: '#fff', fontSize: '0.875rem' }}>{alert.title}</strong>
                              </div>
                              {alert.message && (
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem', marginBottom: 0 }}>
                                  {alert.message}
                                </p>
                              )}
                              <div style={{ fontSize: '0.6875rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                                {timeAgo(alert.created_at)}
                              </div>
                            </div>

                            {alert.pull_request_id && (
                              <Link
                                to={`/prs/${alert.pull_request_id}`}
                                onClick={onClose}
                                className="btn btn-ghost"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#38bdf8', flexShrink: 0 }}
                              >
                                View PR →
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ─── */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(2, 5, 12, 0.75)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>
            PRFlow Intelligence • Repository ID #{repo.id} • GitHub ID #{repo.github_repo_id || 'N/A'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleFocusInDashboard}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
            >
              Open in Command Center
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
