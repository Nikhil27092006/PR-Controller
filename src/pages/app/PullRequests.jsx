import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import DataTable from '../../components/shared/DataTable'
import {
  FireIcon,
  ShieldBlockIcon,
  RepoIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MessageSquareIcon,
  GitMergeIcon,
  GitPullRequestIcon
} from '../../components/shared/Icons'
import { getPRs } from '../../services/prService'
import { useApp } from '../../store/AppContext'

const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { blocked: '#f87171', open: '#60a5fa', merged: '#8b5cf6', closed: '#94a3b8' }

function adaptPR(pr, repoNameById) {
  const ageDays = Math.floor(
    (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    id: pr.id,
    prNumber: pr.github_pr_number,
    title: pr.title,
    branch: 'main',
    repo: repoNameById[pr.repository_id] || `repo #${pr.repository_id}`,
    author: pr.author || 'Unknown',
    avatar: (pr.author || '?').slice(0, 2).toUpperCase(),
    priority: pr.priority_level,
    priorityScore: pr.priority_score,
    status: pr.status,
    age: ageDays === 0 ? 'Today' : `${ageDays}d`,
    reviewCount: pr.review_count,
    ciStatus: pr.failing_checks ? 'failed' : 'success'
  }
}

export default function PullRequests() {
  const { selectedRepoId, repos } = useApp()

  const [rawPRs, setRawPRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'kanban'

  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [repoFilter, setRepoFilter] = useState('All')
  const [searchFilter, setSearchFilter] = useState('')

  const activeRepo = selectedRepoId !== 'all'
    ? repos.find(r => r.id === Number(selectedRepoId))
    : null

  useEffect(() => {
    setLoading(true)
    setError(null)

    getPRs(activeRepo ? activeRepo.id : undefined)
      .then(setRawPRs)
      .catch(err => setError(err.message || 'Failed to load pull requests'))
      .finally(() => setLoading(false))
  }, [activeRepo])

  const repoNameById = Object.fromEntries(
    repos.map(r => [r.id, `${r.owner}/${r.name}`])
  )

  const prs = useMemo(() => rawPRs.map(pr => adaptPR(pr, repoNameById)), [rawPRs, repoNameById])

  const repoOptions = ['All', ...new Set(prs.map(p => p.repo))]
  const priorities  = ['All', 'Critical', 'High', 'Medium', 'Low']
  const statuses    = ['All', 'open', 'blocked', 'merged', 'closed']

  const filteredPRs = useMemo(() => {
    return prs.filter(pr => {
      if (priorityFilter !== 'All' && pr.priority !== priorityFilter) return false
      if (statusFilter !== 'All' && pr.status !== statusFilter) return false
      if (repoFilter !== 'All' && pr.repo !== repoFilter) return false
      if (searchFilter.trim() && !pr.title.toLowerCase().includes(searchFilter.toLowerCase()) && !String(pr.prNumber).includes(searchFilter)) {
        return false
      }
      return true
    })
  }, [prs, priorityFilter, statusFilter, repoFilter, searchFilter])

  const columns = [
    {
      key: 'prNumber', label: 'PR #', sortable: true, width: 85,
      render: (row) => (
        <Link to={`/prs/${row.id}`} style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-300)', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          #{row.prNumber}
        </Link>
      )
    },
    {
      key: 'title', label: 'Title & Branch', sortable: true,
      render: (row) => (
        <Link to={`/prs/${row.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.8125rem', marginBottom: '0.2rem', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="tag" style={{ fontSize: '0.55rem', padding: '0.05rem 0.35rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
              branch: {row.branch}
            </span>
          </div>
        </Link>
      )
    },
    {
      key: 'repo', label: 'Repository', sortable: true, width: 160,
      render: (row) => (
        <span className="tag tag-blue" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <RepoIcon size={10} color="currentColor" />
          <span>{row.repo}</span>
        </span>
      )
    },
    {
      key: 'author', label: 'Author', sortable: true, width: 130,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="reviewer-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            {row.avatar}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>{row.author}</span>
        </div>
      )
    },
    {
      key: 'priorityScore', label: 'Priority', sortable: true, width: 120,
      render: (row) => {
        const pColor = PRIORITY_COLORS[row.priority] || '#60a5fa'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.875rem', color: pColor }}>
              {row.priorityScore}
            </span>
            <span className="tag" style={{ fontSize: '0.6rem', color: pColor, borderColor: `${pColor}40`, background: `${pColor}15`, padding: '0.1rem 0.4rem', fontWeight: 600 }}>
              {row.priority}
            </span>
          </div>
        )
      }
    },
    {
      key: 'status', label: 'Status', sortable: true, width: 110,
      render: (row) => {
        const sColor = STATUS_COLORS[row.status] || '#94a3b8'
        return (
          <span className="tag" style={{ color: sColor, borderColor: `${sColor}40`, background: `${sColor}15`, textTransform: 'capitalize', fontWeight: 600 }}>
            {row.status}
          </span>
        )
      }
    },
    {
      key: 'age', label: 'Age', sortable: false, width: 75,
      render: (row) => <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{row.age}</span>
    },
    {
      key: 'reviewCount', label: 'Reviews', sortable: true, width: 85,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.45rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <MessageSquareIcon size={11} color="var(--cyan-400)" />
          <span>{row.reviewCount}</span>
        </span>
      )
    },
    {
      key: 'ciStatus', label: 'CI', sortable: false, width: 60,
      render: (row) => (
        <span
          title={row.ciStatus === 'success' ? 'All CI checks passing' : 'CI checks failing'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22
          }}
        >
          {row.ciStatus === 'success' ? (
            <CheckCircleIcon size={14} color="#34d399" />
          ) : (
            <XCircleIcon size={14} color="#f87171" />
          )}
        </span>
      )
    },
    {
      key: 'actions', label: '', sortable: false, width: 70,
      render: (row) => (
        <Link to={`/prs/${row.id}`} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', color: 'var(--cyan-400)' }}>
          Inspect
        </Link>
      )
    }
  ]

  const FilterBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      {/* Priority Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Priority:</span>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="form-input"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 30, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 30, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Repo Filter */}
      {repoOptions.length > 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Repo:</span>
          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="form-input"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 30, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {repoOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* View Mode Toggle */}
      <div style={{ marginLeft: 'auto', display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setViewMode('table')}
          style={{
            padding: '0.25rem 0.6rem',
            background: viewMode === 'table' ? 'var(--blue-500)' : 'transparent',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: '0.6875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Table
        </button>
        <button
          onClick={() => setViewMode('kanban')}
          style={{
            padding: '0.25rem 0.6rem',
            background: viewMode === 'kanban' ? 'var(--blue-500)' : 'transparent',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: '0.6875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Board
        </button>
      </div>
    </div>
  )

  const subtitle = activeRepo
    ? `${filteredPRs.length} pull requests tracked in ${activeRepo.owner}/${activeRepo.name}`
    : `${filteredPRs.length} pull requests across all connected repositories`

  // Kanban Columns
  const kanbanColumns = [
    { id: 'critical', title: 'Critical Priority', color: '#fbbf24', icon: <FireIcon size={14} color="#fbbf24" />, items: filteredPRs.filter(p => ['Critical', 'High'].includes(p.priority) && p.status !== 'merged') },
    { id: 'blocked', title: 'Blocked Dependency', color: '#f87171', icon: <ShieldBlockIcon size={14} color="#f87171" />, items: filteredPRs.filter(p => p.status === 'blocked') },
    { id: 'open', title: 'In Review / Active', color: '#60a5fa', icon: <ClockIcon size={14} color="#60a5fa" />, items: filteredPRs.filter(p => p.status === 'open' && !['Critical', 'High'].includes(p.priority)) },
    { id: 'merged', title: 'Merged', color: '#34d399', icon: <GitMergeIcon size={14} color="#34d399" />, items: filteredPRs.filter(p => p.status === 'merged') },
  ]

  return (
    <div className="app-page">
      <DashboardHeader
        title="Pull Requests"
        subtitle={subtitle}
        onSearch={(q) => setSearchFilter(q)}
      />

      <div className="page-content">

        {/* Top Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Tracked PRs', count: filteredPRs.length, color: '#3b82f6' },
            { label: 'Critical / High Urgency', count: filteredPRs.filter(p => ['Critical', 'High'].includes(p.priority)).length, color: '#fbbf24' },
            { label: 'Blocked Bottlenecks', count: filteredPRs.filter(p => p.status === 'blocked').length, color: '#f87171' },
            { label: 'Merged This Sprint', count: filteredPRs.filter(p => p.status === 'merged').length, color: '#34d399' }
          ].map((s, i) => (
            <div key={i} className="glass stat-card" style={{ borderRadius: 10, padding: '1rem', borderColor: `${s.color}25` }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* View mode toggle header */}
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filteredPRs}
            loading={loading}
            error={error}
            searchKey="title"
            searchPlaceholder="Filter PR titles or numbers..."
            filterComponent={FilterBar}
            pageSize={10}
            emptyMessage="No pull requests match the current filters."
          />
        ) : (
          <div>
            <div className="glass" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {FilterBar}
            </div>

            <div className="kanban-board-grid">
              {kanbanColumns.map(col => (
                <div key={col.id} className="kanban-column" style={{ borderColor: `${col.color}20` }}>
                  <div className="kanban-col-header">
                    <div className="kanban-col-title" style={{ color: col.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {col.icon}
                      <span>{col.title}</span>
                    </div>
                    <span className="triage-count-badge" style={{ background: `${col.color}20`, color: col.color }}>
                      {col.items.length}
                    </span>
                  </div>

                  {col.items.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                      No PRs in this lane
                    </div>
                  ) : (
                    col.items.map(item => (
                      <Link
                        key={item.id}
                        to={`/prs/${item.id}`}
                        className="kanban-card"
                        style={{ borderColor: `${PRIORITY_COLORS[item.priority]}25` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--blue-300)' }}>
                            #{item.prNumber}
                          </span>
                          <span className="tag" style={{ fontSize: '0.55rem', color: PRIORITY_COLORS[item.priority], borderColor: `${PRIORITY_COLORS[item.priority]}35`, background: `${PRIORITY_COLORS[item.priority]}15` }}>
                            Score: {item.priorityScore}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#fff', lineHeight: 1.3 }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <RepoIcon size={10} color="currentColor" />
                            <span>{item.repo}</span>
                          </span>
                          <span>{item.age}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
