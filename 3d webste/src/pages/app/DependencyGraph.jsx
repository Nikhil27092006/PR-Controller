import React, { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { MOCK_DEPENDENCY_NETWORK, MOCK_PRS } from '../../services/mockData'
import { useApp } from '../../store/AppContext'

export default function DependencyGraph() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)
  const [search, setSearch] = useState('')
  const { selectedRepoId, repos: contextRepos } = useApp()

  // Derive active repository name from context
  const activeRepo = selectedRepoId !== 'all'
    ? contextRepos.find(r => r.id === selectedRepoId)
    : null
  const activeRepoName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : null

  // Scope PRs to selected repo, then build visible node IDs
  const scopedPRIds = activeRepoName
    ? new Set(MOCK_PRS.filter(pr => pr.repo === activeRepoName).map(pr => pr.id))
    : null

  const allNodes = MOCK_DEPENDENCY_NETWORK.nodes
  const allLinks = MOCK_DEPENDENCY_NETWORK.links

  const nodes = scopedPRIds
    ? allNodes.filter(n => scopedPRIds.has(n.id))
    : allNodes
  const visibleNodeIds = new Set(nodes.map(n => n.id))
  const links = allLinks.filter(l => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target))

  const selectedPR = selectedNode ? MOCK_PRS.find(p => p.id === selectedNode) : null

  const filteredNodes = search ? nodes.filter(n => n.id.includes(search) || n.label.toLowerCase().includes(search.toLowerCase())) : nodes

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.4, Math.min(3, z * delta)))
  }, [])

  const VW = 1000; const VH = 340

  const subtitle = activeRepoName
    ? `Blocking relationships in ${activeRepoName}`
    : 'Interactive PR blocking relationship network'

  return (
    <div className="app-page">
      <DashboardHeader title="Dependency Graph" subtitle={subtitle} />
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          {/* Graph Canvas */}
          <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-4)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="table-search-wrap" style={{ flex: 1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search PR nodes..." value={search} onChange={e => setSearch(e.target.value)} className="table-search-input" aria-label="Search nodes" />
              </div>
              <button onClick={() => { setZoom(z => Math.min(3, z * 1.2)) }} className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem' }} aria-label="Zoom in">+</button>
              <button onClick={() => { setZoom(z => Math.max(0.4, z * 0.8)) }} className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem' }} aria-label="Zoom out">−</button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="btn btn-ghost" style={{ padding: '0.375rem 0.75rem' }} aria-label="Reset view">Reset</button>
            </div>

            <div
              style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              aria-label="Dependency network graph. Drag to pan, scroll to zoom, click nodes to inspect."
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VW} ${VH}`}
                style={{ width: '100%', height: 340, display: 'block' }}
                role="img"
              >
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Render links */}
                  {links.map((link, i) => {
                    const src = nodes.find(n => n.id === link.source)
                    const tgt = nodes.find(n => n.id === link.target)
                    if (!src || !tgt) return null
                    const isHighlighted = selectedNode === link.source || selectedNode === link.target
                    return (
                      <g key={i}>
                        <line
                          x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                          stroke={isHighlighted ? '#fbbf24' : 'rgba(255,255,255,0.12)'}
                          strokeWidth={isHighlighted ? 2 : 1}
                          strokeDasharray={isHighlighted ? '0' : '6 4'}
                        />
                        <text x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 - 5} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">blocks</text>
                      </g>
                    )
                  })}

                  {/* Render nodes */}
                  {nodes.map((node) => {
                    const isSelected = selectedNode === node.id
                    const isHighlighted = !search || filteredNodes.find(n => n.id === node.id)
                    const opacity = isHighlighted ? 1 : 0.25
                    return (
                      <g key={node.id} onClick={() => setSelectedNode(isSelected ? null : node.id)} style={{ cursor: 'pointer' }} opacity={opacity}>
                        <circle
                          cx={node.x} cy={node.y} r={isSelected ? 28 : 22}
                          fill={`${node.color}22`}
                          stroke={node.color}
                          strokeWidth={isSelected ? 3 : 1.5}
                          filter={isSelected ? 'url(#glow)' : undefined}
                        />
                        <text x={node.x} y={node.y - 1} textAnchor="middle" fill={node.color} fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">#{node.id}</text>
                        <text x={node.x} y={node.y + 11} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8">{node.status}</text>
                      </g>
                    )
                  })}

                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                </g>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-4)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[['#fbbf24','Critical'],['#60a5fa','High'],['#22d3ee','Medium'],['#34d399','Ready']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-60)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  {l}
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-40)' }}>Drag to pan · Scroll to zoom · Click to inspect</div>
            </div>
          </div>

          {/* Sidebar Detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Impact Analysis */}
            <div className="glass" style={{ borderRadius: 14, padding: '1.25rem' }}>
              <h3 className="section-title" style={{ marginBottom: '0.875rem' }}>Impact Analysis</h3>
              {[
                { label: 'Total PRs in graph', value: nodes.length },
                { label: 'Total blocking links', value: links.length },
                { label: 'Critical path depth', value: '4 levels' },
                { label: 'Est. cascade delay', value: '2.8 days' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid var(--border-4)' : 'none' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-60)' }}>{s.label}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-100)', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Node Detail */}
            {selectedPR ? (
              <div className="glass" style={{ borderRadius: 14, padding: '1.25rem', borderColor: `${selectedPR.priorityScore >= 85 ? '#fbbf24' : '#3b82f6'}30` }}>
                <h3 className="section-title" style={{ marginBottom: '0.875rem' }}>PR #{selectedPR.id}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-80)', marginBottom: '0.875rem' }}>{selectedPR.title}</p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span className="tag tag-blue">{selectedPR.repo}</span>
                  <span className="tag" style={{ color: '#fbbf24', borderColor: '#fbbf2435', background: '#fbbf2412' }}>{selectedPR.priorityScore}</span>
                </div>
                <Link to={`/prs/${selectedPR.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Details →
                </Link>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.625rem', color: 'var(--text-20)' }}>◈</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)' }}>Click any node in the graph to inspect its details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
