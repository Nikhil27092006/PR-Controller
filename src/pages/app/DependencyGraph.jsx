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
import { getDependencyGraph } from '../../services/dependencyService'

const STATUS_LABEL = {
  open: 'Open',
  blocked: 'Blocked',
  merged: 'Merged',
  closed: 'Closed'
}

// Custom node renderer — a small card matching the app's glass
// aesthetic instead of reactflow's plain default box.
function PRNode({ data }) {
  return (
    <div
      style={{
        padding: '0.625rem 0.875rem',
        borderRadius: 10,
        background: 'rgba(20, 22, 30, 0.9)',
        border: `1.5px solid ${data.color}70`,
        boxShadow: `0 0 0 1px ${data.color}20, 0 4px 12px rgba(0,0,0,0.3)`,
        minWidth: 180,
        fontFamily: 'var(--font-sans, system-ui)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: data.color, fontWeight: 700 }}>
          #{data.prNumber}
        </span>
        <span
          className="tag"
          style={{ fontSize: '0.55rem', padding: '0.05rem 0.35rem', color: data.color, borderColor: `${data.color}40`, background: `${data.color}15` }}
        >
          {data.priorityLevel}
        </span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: 500, lineHeight: 1.3, marginBottom: '0.3rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {data.title}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
        {STATUS_LABEL[data.status] || data.status}
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
      animated: e.animated,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.35)' },
      style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 }
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
        <DashboardHeader title="Dependency Graph" subtitle="PR blocking relationships across your repositories" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>Loading graph...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <DashboardHeader title="Dependency Graph" subtitle="PR blocking relationships across your repositories" />
        <div className="page-content">
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <DashboardHeader title="Dependency Graph" subtitle="PR blocking relationships across your repositories" />
      <div className="page-content">
        {rawGraph.nodes.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-40)' }}>
            No dependencies detected yet. Dependencies are found automatically when a PR description
            mentions phrases like "depends on #123" or "blocked by #45".
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', height: 520 }}>
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
                <Background color="rgba(255,255,255,0.06)" gap={20} />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(n) => n.data?.color || '#94a3b8'}
                  maskColor="rgba(10,10,15,0.7)"
                  style={{ background: 'rgba(20,22,30,0.9)' }}
                />
              </ReactFlow>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass" style={{ borderRadius: 14, padding: '1.25rem' }}>
                <h3 className="section-title" style={{ marginBottom: '0.875rem' }}>Graph Summary</h3>
                {[
                  { label: 'PRs in graph', value: rawGraph.nodes.length },
                  { label: 'Dependency links', value: rawGraph.edges.length },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 1 ? '1px solid var(--border-4)' : 'none' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-60)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-100)', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {selectedNode ? (
                <div className="glass" style={{ borderRadius: 14, padding: '1.25rem', borderColor: `${selectedNode.data.color}30` }}>
                  <h3 className="section-title" style={{ marginBottom: '0.875rem' }}>PR #{selectedNode.data.prNumber}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-80)', marginBottom: '0.875rem' }}>{selectedNode.data.title}</p>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span className="tag" style={{ color: selectedNode.data.color, borderColor: `${selectedNode.data.color}35`, background: `${selectedNode.data.color}12` }}>
                      {selectedNode.data.priorityLevel} · {selectedNode.data.priorityScore}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '1rem' }}>
                    Blocking {blockedByCount} PR{blockedByCount === 1 ? '' : 's'} · Waiting on {blockingCount} PR{blockingCount === 1 ? '' : 's'}
                  </div>
                  <Link to="/prs" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    View in Pull Requests →
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
        )}
      </div>
    </div>
  )
}
