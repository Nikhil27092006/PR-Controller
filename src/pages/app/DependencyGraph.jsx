import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { AlertTriangleIcon, LayersIcon } from '../../components/shared/Icons'
import { getDependencyGraph } from '../../services/dependencyService'


const STATUS_LABEL = {
  open: 'Open',
  blocked: 'Blocked',
  merged: 'Merged',
  closed: 'Closed'
}

function PRNode({ data }) {
  const isCritical = data.priorityLevel === 'Critical'
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: 12,
        background: 'rgba(8, 14, 28, 0.95)',
        border: `1.5px solid ${data.color || '#3b82f6'}80`,
        boxShadow: `0 0 20px ${data.color || '#3b82f6'}25, 0 8px 24px rgba(0,0,0,0.6)`,
        minWidth: 200,
        fontFamily: 'var(--font-sans, system-ui)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: data.color || '#3b82f6' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: data.color || 'var(--cyan-400)', fontWeight: 800 }}>
          #{data.prNumber}
        </span>
        <span
          className="tag"
          style={{ fontSize: '0.55rem', padding: '0.05rem 0.35rem', color: data.color, borderColor: `${data.color}40`, background: `${data.color}15`, fontWeight: 700 }}
        >
          {data.priorityLevel}
        </span>
      </div>
      <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.4rem', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {data.title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
        <span>{STATUS_LABEL[data.status] || data.status}</span>
        <span>Score: {data.priorityScore || '—'}</span>
      </div>
    </div>
  )
}

const nodeTypes = { prNode: PRNode }

export default function DependencyGraph() {
  const [rawGraph, setRawGraph] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getDependencyGraph()
      .then(setRawGraph)
      .catch(err => setError(err.message || 'Failed to load dependency graph'))
      .finally(() => setLoading(false))
  }, [])

  const initialNodes = useMemo(
    () => rawGraph.nodes.map(n => ({
      id: n.id,
      position: n.position,
      type: 'prNode',
      data: n.data
    })),
    [rawGraph.nodes]
  )

  const initialEdges = useMemo(
    () => rawGraph.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--cyan-400)' },
      style: { stroke: 'rgba(34, 211, 238, 0.6)', strokeWidth: 2 }
    })),
    [rawGraph.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNodeId(prev => (prev === node.id ? null : node.id))
  }, [])

  const selectedNode = rawGraph.nodes.find(n => n.id === selectedNodeId)

  const blockingCount = selectedNodeId
    ? rawGraph.edges.filter(e => e.target === selectedNodeId).length
    : 0

  const blockedByCount = selectedNodeId
    ? rawGraph.edges.filter(e => e.source === selectedNodeId).length
    : 0

  if (loading) {
    return (
      <div className="app-page">
        <DashboardHeader title="Dependency Graph" subtitle="Neural topological mapping of PR blocking chains" />
        <div className="page-content">
          <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div className="live-pulse-dot" style={{ margin: '0 auto 1.5rem', width: 14, height: 14 }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              Calculating Cross-PR Dependency Lattice...
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Parsing commit metadata, issue linkage tags, and pull request descriptions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Dependency Graph" subtitle="Neural topological mapping of PR blocking chains" />
        <div className="page-content">
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <AlertTriangleIcon size={32} color="#f87171" />
            </div>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader 
        title="Dependency Graph" 
        subtitle="Topological mapping of blocker chains & downstream blast radius" 
      />

      <div className="page-content">

        {/* ── Summary Counters ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div className="glass stat-card" style={{ borderRadius: 10, padding: '1rem', borderColor: 'rgba(59,130,246,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
              {rawGraph.nodes.length}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', textTransform: 'uppercase' }}>
              Tracked PR Nodes
            </div>
          </div>
          <div className="glass stat-card" style={{ borderRadius: 10, padding: '1rem', borderColor: 'rgba(248,113,113,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#f87171', lineHeight: 1 }}>
              {rawGraph.edges.length}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', textTransform: 'uppercase' }}>
              Active Dependency Links
            </div>
          </div>
          <div className="glass stat-card" style={{ borderRadius: 10, padding: '1rem', borderColor: 'rgba(34,211,238,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan-400)', lineHeight: 1 }}>
              {rawGraph.edges.length > 0 ? 'Lattice Active' : 'Autonomous'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', textTransform: 'uppercase' }}>
              Pipeline Flow Status
            </div>
          </div>
        </div>

        {rawGraph.nodes.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-40)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <LayersIcon size={44} color="var(--cyan-400)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Cross-PR Dependencies Detected
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto' }}>
              Dependencies are automatically parsed from pull request descriptions when phrases like 
              <code style={{ color: 'var(--cyan-400)', margin: '0 0.3rem' }}>"depends on #12"</code> or 
              <code style={{ color: 'var(--cyan-400)', margin: '0 0.3rem' }}>"blocked by #45"</code> are added.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
            <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', height: 560, border: '1px solid rgba(255,255,255,0.08)' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background color="rgba(34,211,238,0.08)" gap={24} size={1.5} />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(n) => n.data?.color || '#3b82f6'}
                  maskColor="rgba(2, 4, 8, 0.75)"
                  style={{ background: 'rgba(8, 14, 28, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                />
              </ReactFlow>
            </div>

            {/* Side Node Detail Inspector */}
            <div>
              {selectedNode ? (
                <div className="glass" style={{ borderRadius: 16, padding: '1.5rem', background: 'rgba(8,14,28,0.95)', border: `1px solid ${selectedNode.data.color || '#3b82f6'}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="tag" style={{ color: selectedNode.data.color, borderColor: `${selectedNode.data.color}40`, background: `${selectedNode.data.color}15`, fontWeight: 700 }}>
                      PR #{selectedNode.data.prNumber}
                    </span>
                    <span className="tag" style={{ textTransform: 'capitalize' }}>
                      {selectedNode.data.status}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {selectedNode.data.title}
                  </h3>

                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>
                    by @{selectedNode.data.author || 'dev'} • Priority Score: <strong style={{ color: selectedNode.data.color }}>{selectedNode.data.priorityScore}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Upstream Blockers</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fbbf24', marginTop: '0.2rem' }}>
                        {blockingCount > 0 ? `Waiting on ${blockingCount} PR(s)` : 'Clear to Merge'}
                      </div>
                    </div>
                    <div style={{ padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Downstream Impact</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f87171', marginTop: '0.2rem' }}>
                        {blockedByCount > 0 ? `Blocks ${blockedByCount} dependent PRs` : 'Zero Downstream Impact'}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/prs/${selectedNode.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Open Deep Telemetry →
                  </Link>
                </div>
              ) : (
                <div className="glass" style={{ borderRadius: 16, padding: '2.5rem 1.5rem', textAlign: 'center', background: 'rgba(8,14,28,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <LayersIcon size={32} color="var(--cyan-400)" />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Topological Node Inspector
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    Click any node inside the interactive canvas to inspect blocker paths, priority metrics, and blast radius impact.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
