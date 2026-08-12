
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import DataTable from '../../components/shared/DataTable'
import { MOCK_PRS } from '../../services/mockData'
import { useApp } from '../../store/AppContext'
import React,{ useEffect, useState }
from "react";

import {
  getPRs
}
from "../../services/prService";



const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { Blocked: '#f87171', Reviewing: '#fbbf24', 'In Progress': '#60a5fa', Ready: '#34d399', Merged: '#8b5cf6' }
const CI_ICONS        = { success: '✓', failed: '✗', pending: '⟳' }
const CI_COLORS       = { success: '#34d399', failed: '#f87171', pending: '#fbbf24' }


export default function PullRequests() {
  const navigate = useNavigate()
  const { selectedRepoId, repos: contextRepos } = useApp()
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [repoFilter, setRepoFilter] = useState('All')

    const [prs, setPRs] =
    useState([]);

  useEffect(() => {

    getPRs()
      .then(setPRs);

  }, []);

  return (

    <table>

      <thead>

        <tr>

          <th>Title</th>

          <th>Priority</th>

        </tr>

      </thead>

      <tbody>

      {
        prs.map(pr => (

          <tr key={pr.id}>

            <td>{pr.title}</td>

            <td>
              {pr.priority_level}
            </td>

          </tr>

        ))
      }

      </tbody>

    </table>

  );

  // Derive active repository name from context
  const activeRepo = selectedRepoId !== 'all'
    ? contextRepos.find(r => r.id === selectedRepoId)
    : null
  const activeRepoName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : null

  // Base data scoped to selected repo
  const scopedPRs = activeRepoName
    ? MOCK_PRS.filter(pr => pr.repo === activeRepoName)
    : MOCK_PRS

  const repoOptions = ['All', ...new Set(MOCK_PRS.map(p => p.repo))]
  const priorities  = ['All', 'Critical', 'High', 'Medium', 'Low']
  const statuses    = ['All', 'Blocked', 'Reviewing', 'In Progress', 'Ready', 'Merged']

  const filteredPRs = scopedPRs.filter(pr => {
    if (priorityFilter !== 'All' && pr.priority !== priorityFilter) return false
    if (statusFilter !== 'All' && pr.status !== statusFilter) return false
    if (repoFilter !== 'All' && pr.repo !== repoFilter) return false
    return true
  })

  const columns = [
    {
      key: 'id', label: 'PR #', sortable: true, width: 70,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-300)', fontSize: '0.8125rem' }}>#{row.id}</span>
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

  const subtitle = activeRepoName
    ? `${filteredPRs.length} pull requests in ${activeRepoName}`
    : `${filteredPRs.length} pull requests across all repositories`

  return (
    <div className="app-page">
      <DashboardHeader title="Pull Requests" subtitle={subtitle} />
      <div className="page-content">
        <DataTable
          columns={columns}
          data={filteredPRs}
          searchKey="title"
          searchPlaceholder="Search PR titles or branches..."
          filterComponent={FilterBar}
          pageSize={8}
          emptyMessage="No pull requests match the current filters."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.5rem' }}>
          {[{ label: 'Critical+High PRs', count: filteredPRs.filter(p => ['Critical','High'].includes(p.priority)).length, color: '#fbbf24' },
            { label: 'Blocked PRs', count: filteredPRs.filter(p => p.status === 'Blocked').length, color: '#f87171' },
            { label: 'Merged this sprint', count: filteredPRs.filter(p => p.status === 'Merged').length, color: '#34d399' }
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
