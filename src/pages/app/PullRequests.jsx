import React, { useEffect, useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import DataTable from '../../components/shared/DataTable'
import { getPRs } from '../../services/prService'
import { useApp } from '../../store/AppContext'

const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { blocked: '#f87171', open: '#60a5fa', merged: '#8b5cf6', closed: '#94a3b8' }

// Maps the backend PullRequestResponse shape onto the fields this
// page's table/columns expect. Some fields (branch name, CI status)
// aren't tracked by the backend yet, so they're shown as "—" rather
// than invented.
function adaptPR(pr, repoNameById) {
  const ageDays = Math.floor(
    (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    id: pr.id,
    prNumber: pr.github_pr_number,
    title: pr.title,
    branch: '—',
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

const CI_ICONS  = { success: '✓', failed: '✗', pending: '⟳' }
const CI_COLORS = { success: '#34d399', failed: '#f87171', pending: '#fbbf24' }

export default function PullRequests() {
  const { selectedRepoId, repos } = useApp()

  const [rawPRs, setRawPRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [repoFilter, setRepoFilter] = useState('All')

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

  const prs = rawPRs.map(pr => adaptPR(pr, repoNameById))

  const repoOptions = ['All', ...new Set(prs.map(p => p.repo))]
  const priorities  = ['All', 'Critical', 'High', 'Medium', 'Low']
  const statuses    = ['All', 'open', 'blocked', 'merged', 'closed']

  const filteredPRs = prs.filter(pr => {
    if (priorityFilter !== 'All' && pr.priority !== priorityFilter) return false
    if (statusFilter !== 'All' && pr.status !== statusFilter) return false
    if (repoFilter !== 'All' && pr.repo !== repoFilter) return false
    return true
  })

  const columns = [
    {
      key: 'prNumber', label: 'PR #', sortable: true, width: 70,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-300)', fontSize: '0.8125rem' }}>#{row.prNumber}</span>
    },
    {
      key: 'title', label: 'Title', sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-100)', fontSize: '0.8125rem', marginBottom: '0.15rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-40)' }}>{row.branch}</div>
        </div>
      )
    },
    {
      key: 'repo', label: 'Repository', sortable: true, width: 160,
      render: (row) => <span className="tag tag-blue" style={{ fontSize: '0.6875rem' }}>{row.repo}</span>
    },
    {
      key: 'author', label: 'Author', sortable: true, width: 130,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="reviewer-avatar" style={{ width: 26, height: 26, fontSize: '0.6rem', background: 'var(--bg-glass)', border: '1px solid var(--border-8)', color: 'var(--text-60)' }}>{row.avatar}</div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{row.author}</span>
        </div>
      )
    },
    {
      key: 'priorityScore', label: 'Priority', sortable: true, width: 110,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: PRIORITY_COLORS[row.priority] }}>{row.priorityScore}</span>
          <span className="tag" style={{ fontSize: '0.6rem', color: PRIORITY_COLORS[row.priority], borderColor: `${PRIORITY_COLORS[row.priority]}35`, background: `${PRIORITY_COLORS[row.priority]}10`, padding: '0.1rem 0.4rem' }}>{row.priority}</span>
        </div>
      )
    },
    {
      key: 'status', label: 'Status', sortable: true, width: 120,
      render: (row) => <span className="tag" style={{ color: STATUS_COLORS[row.status], borderColor: `${STATUS_COLORS[row.status]}35`, background: `${STATUS_COLORS[row.status]}12` }}>{row.status}</span>
    },
    {
      key: 'age', label: 'Age', sortable: false, width: 80,
      render: (row) => <span style={{ fontSize: '0.8125rem', color: 'var(--text-40)' }}>{row.age}</span>
    },
    {
      key: 'reviewCount', label: 'Reviews', sortable: true, width: 80,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-60)' }}>{row.reviewCount}</span>
    },
    {
      key: 'ciStatus', label: 'CI', sortable: false, width: 50,
      render: (row) => <span title={row.ciStatus} style={{ color: CI_COLORS[row.ciStatus], fontWeight: 700 }}>{CI_ICONS[row.ciStatus]}</span>
    },
  ]

  const FilterBar = (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {[
        { label: 'Priority', state: priorityFilter, setter: setPriorityFilter, opts: priorities },
        { label: 'Status',   state: statusFilter,   setter: setStatusFilter,   opts: statuses },
        { label: 'Repo',     state: repoFilter,     setter: setRepoFilter,     opts: repoOptions },
      ].map(f => (
        <select key={f.label} value={f.state} onChange={e => f.setter(e.target.value)} className="filter-select" aria-label={`Filter by ${f.label}`}>
          {f.opts.map(o => <option key={o} value={o}>{f.label}: {o}</option>)}
        </select>
      ))}
    </div>
  )

  const subtitle = activeRepo
    ? `${filteredPRs.length} pull requests in ${activeRepo.owner}/${activeRepo.name}`
    : `${filteredPRs.length} pull requests across all repositories`

  return (
    <div className="app-page">
      <DashboardHeader title="Pull Requests" subtitle={subtitle} />
      <div className="page-content">
        <DataTable
          columns={columns}
          data={filteredPRs}
          loading={loading}
          error={error}
          searchKey="title"
          searchPlaceholder="Search PR titles..."
          filterComponent={FilterBar}
          pageSize={8}
          emptyMessage="No pull requests match the current filters."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.5rem' }}>
          {[{ label: 'Critical+High PRs', count: filteredPRs.filter(p => ['Critical', 'High'].includes(p.priority)).length, color: '#fbbf24' },
            { label: 'Blocked PRs', count: filteredPRs.filter(p => p.status === 'blocked').length, color: '#f87171' },
            { label: 'Merged this sprint', count: filteredPRs.filter(p => p.status === 'merged').length, color: '#34d399' }
          ].map((s, i) => (
            <div key={i} className="glass-md" style={{ borderRadius: 10, padding: '0.875rem', borderColor: `${s.color}25` }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
