import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { MOCK_PRS, MOCK_REVIEWERS } from '../../services/mockData'
import { gsap } from 'gsap'

const REPOS = ['All', 'vercel/next.js', 'facebook/react', 'fastapi/fastapi']
const PRIORITY_COLORS = { Critical: '#fbbf24', High: '#60a5fa', Medium: '#a855f7', Low: '#34d399' }
const STATUS_COLORS   = { Blocked: '#f87171', Reviewing: '#fbbf24', 'In Progress': '#60a5fa', Ready: '#34d399', Merged: '#8b5cf6' }
const CI_COLORS       = { success: '#34d399', failed: '#f87171', pending: '#fbbf24' }

// ─── Real-Time Typing Simulation Terminal Logs ──────────────────────────────
function TerminalLogs({ pr }) {
  const [logs, setLogs] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    setLogs([])
    const lines = [
      `[INFO] Initializing PRFlow Priority Engine v3.0...`,
      `[INFO] Ingesting metadata for PR #${pr.id} (${pr.repo})...`,
      `[DB]   Resolving repository configurations... OK`,
      `[GRAPH] Traced upstream blocker tree: ${pr.dependencies.blocking.length > 0 ? 'PR #' + pr.dependencies.blocking.join(', #') : 'None'}`,
      `[GRAPH] Traced downstream cascade delay: ${pr.dependencies.blocked.length > 0 ? 'PR #' + pr.dependencies.blocked.join(', #') : 'None'}`,
      `[METRICS] Queue age: ${pr.age} | Diff stats: +${pr.additions} -${pr.deletions} lines`,
      `[WARN] Checking reviewer loads: alex.chen is at 94% overload status`,
      `[RESOLVER] Computing priority factors weights...`,
      `[SUCCESS] Analysis completed. Final Priority Score: ${pr.priorityScore} (${pr.priority.toUpperCase()}).`
    ]

    let current = 0
    const interval = setInterval(() => {
      if (current < lines.length) {
        setLogs(prev => [...prev, lines[current]])
        current++
      } else {
        clearInterval(interval)
      }
    }, 350)

    return () => clearInterval(interval)
  }, [pr])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div
      ref={containerRef}
      style={{
        background: 'rgba(2, 4, 7, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: '0.875rem 1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        color: '#a8ffb2',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        minHeight: 140,
        maxHeight: 180,
        overflowY: 'auto',
        textAlign: 'left'
      }}
    >
      {logs.map((log, i) => {
        let color = '#a8ffb2'
        if (log.includes('[WARN]')) color = '#fcd34d'
        if (log.includes('[INFO]')) color = '#93c5fd'
        if (log.includes('[SUCCESS]')) color = '#34d399'
        return <div key={i} style={{ color, lineHeight: 1.45 }}>{log}</div>
      })}
      {logs.length < 9 && (
        <div style={{ width: 6, height: 12, background: 'rgba(255,255,255,0.5)', animation: 'pulse 1s infinite' }} />
      )}
    </div>
  )
}

// ─── Mini Dependency Graph ───────────────────────────────────────────────────
function DrawerDependencyGraph({ pr }) {
  const blocking = pr.dependencies.blocking || []
  const blocked = pr.dependencies.blocked || []
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Dependency Chain Map
      </div>
      <svg width="100%" height="80" viewBox="0 0 360 80" style={{ overflow: 'visible' }}>
        <defs>
          <style>{`
            @keyframes edgePulse {
              to { stroke-dashoffset: -10; }
            }
          `}</style>
        </defs>
        
        {blocking.length > 0 && (
          <path d="M 85 40 L 155 40" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 2" style={{ animation: 'edgePulse 1s linear infinite' }} />
        )}
        {blocked.length > 0 && (
          <path d="M 205 40 L 275 40" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 2" style={{ animation: 'edgePulse 1s linear infinite' }} />
        )}

        {/* Blocking Node */}
        {blocking.length > 0 ? (
          <g transform="translate(60, 40)">
            <circle r="18" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
            <text dy="3" textAnchor="middle" fill="#fca5a5" style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>PR #{blocking[0]}</text>
            <text dy="26" textAnchor="middle" fill="rgba(255,255,255,0.35)" style={{ fontSize: '0.55rem' }}>BLOCKS THIS</text>
          </g>
        ) : (
          <g transform="translate(60, 40)">
            <circle r="15" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
            <text dy="3" textAnchor="middle" fill="rgba(255,255,255,0.15)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>None</text>
            <text dy="24" textAnchor="middle" fill="rgba(255,255,255,0.15)" style={{ fontSize: '0.55rem' }}>UPSTREAM</text>
          </g>
        )}

        {/* Current Node */}
        <g transform="translate(180, 40)">
          <circle r="20" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2" />
          <text dy="3.5" textAnchor="middle" fill="#fff" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>PR #{pr.id}</text>
          <text dy="28" textAnchor="middle" fill="#fbbf24" style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.03em' }}>ACTIVE</text>
        </g>

        {/* Blocked Node */}
        {blocked.length > 0 ? (
          <g transform="translate(300, 40)">
            <circle r="18" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
            <text dy="3" textAnchor="middle" fill="#6ee7b7" style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>PR #{blocked[0]}</text>
            <text dy="26" textAnchor="middle" fill="rgba(255,255,255,0.35)" style={{ fontSize: '0.55rem' }}>BLOCKED BY</text>
          </g>
        ) : (
          <g transform="translate(300, 40)">
            <circle r="15" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
            <text dy="3" textAnchor="middle" fill="rgba(255,255,255,0.15)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>None</text>
            <text dy="24" textAnchor="middle" fill="rgba(255,255,255,0.15)" style={{ fontSize: '0.55rem' }}>DOWNSTREAM</text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── Glassmorphic Slide-Out Inspector Drawer ─────────────────────────────────
function PRInspectorDrawer({ pr, onClose }) {
  const drawerRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (pr) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      gsap.fromTo(drawerRef.current, { x: '100%' }, { x: 0, duration: 0.45, ease: 'power3.out' })
    }
  }, [pr])

  const handleClose = () => {
    gsap.to(drawerRef.current, {
      x: '100%',
      duration: 0.35,
      ease: 'power3.in',
      onComplete: onClose
    })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 })
  }

  if (!pr) return null

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(2, 4, 7, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />
      <div
        ref={drawerRef}
        className="glass-strong"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(460px, 90vw)',
          zIndex: 310,
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          overflowY: 'auto'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--blue-400)', fontWeight: 700 }}>PR #{pr.id}</span>
              <span className="tag" style={{ color: PRIORITY_COLORS[pr.priority], borderColor: `${PRIORITY_COLORS[pr.priority]}22`, background: `${PRIORITY_COLORS[pr.priority]}08`, fontSize: '0.65rem' }}>
                {pr.priority} Priority
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>{pr.title}</h3>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer', outline: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            ✕
          </button>
        </div>

        {/* Priority dial widget */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 10,
            background: `${PRIORITY_COLORS[pr.priority]}15`,
            border: `1px solid ${PRIORITY_COLORS[pr.priority]}35`,
            color: PRIORITY_COLORS[pr.priority],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.375rem', fontWeight: 800, fontFamily: 'var(--font-heading)'
          }}>
            {pr.priorityScore}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Priority Score Factors</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-40)', marginTop: 2 }}>This score weights blocker status, assignee queue loads and branch sizes.</div>
          </div>
        </div>

        {/* Blocker mapping */}
        <DrawerDependencyGraph pr={pr} />

        {/* Real-time simulations log */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Analysis Engine Execution
          </div>
          <TerminalLogs pr={pr} />
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            PR Information
          </div>
          {[
            { label: 'Repo Scope', value: pr.repo },
            { label: 'Author Identity', value: pr.author },
            { label: 'Branch Source', value: pr.branch },
            { label: 'Base Branch', value: pr.baseBranch },
            { label: 'Code Delta', value: `+${pr.additions} additions / -${pr.deletions} deletions` }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-40)' }}>{item.label}</span>
              <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Link
          to="/register"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
        >
          Integrate to GitHub →
        </Link>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalysisDemo() {
  const [selectedRepo, setSelectedRepo] = useState('All')
  const [selectedPR, setSelectedPR] = useState(null)
  
  const queueRef = useRef(null)

  // Filter PRs
  const filteredPRs = MOCK_PRS.filter(pr => {
    if (selectedRepo !== 'All' && pr.repo !== selectedRepo) return false
    return true
  })

  // Reviewers matching filtered Repos
  const repoReviewers = MOCK_REVIEWERS.filter(rev => {
    if (selectedRepo === 'All') return true
    const assignedPRs = MOCK_PRS.filter(pr => pr.repo === selectedRepo && pr.reviewers.includes(rev.name))
    return assignedPRs.length > 0
  })

  // Calculate statistics
  const totalPRs = filteredPRs.length
  const blockedCount = filteredPRs.filter(p => p.status === 'Blocked').length
  const criticalCount = filteredPRs.filter(p => p.priority === 'Critical').length
  const avgPriority = totalPRs ? Math.round(filteredPRs.reduce((a, b) => a + b.priorityScore, 0) / totalPRs) : 0

  // Stagger reveal on repository tabs toggled
  useEffect(() => {
    if (queueRef.current) {
      gsap.fromTo(queueRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' }
      )
    }
  }, [selectedRepo])

  return (
    <div className="public-page-bg" style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.4) 0%, var(--bg-void) 80%)', position: 'relative' }}>
      <Navbar scrolled />

      <div style={{ paddingTop: 'var(--nav-h)', maxWidth: 1200, margin: '0 auto', padding: 'var(--nav-h) 2rem 6rem', position: 'relative', zIndex: 1 }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span className="eyebrow-pulse" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
            Live Simulation
          </span>
          <h1 className="display-lg" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
            Repository <span className="grad-blue-cyan">Analysis Output</span>
          </h1>
          <p className="body-lg" style={{ maxWidth: 600, margin: '0 auto 2.5rem' }}>
            Review live analytical outputs calculated by the PRFlow Intelligence engine, including dependency graphs, reviewer workload metrics, and prioritized pull requests.
          </p>

          {/* Repo selectors */}
          <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '0.3rem' }}>
            {REPOS.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRepo(r)}
                className="btn"
                style={{
                  background: selectedRepo === r ? 'rgba(34,211,238,0.1)' : 'transparent',
                  border: 'none',
                  color: selectedRepo === r ? 'var(--cyan-400)' : 'rgba(255,255,255,0.4)',
                  outline: selectedRepo === r ? '1px solid rgba(34,211,238,0.15)' : 'none',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  borderRadius: 8
                }}
              >
                {r === 'All' ? 'All Repositories' : r.split('/')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Active Pull Requests', value: totalPRs, color: '#3b82f6', icon: '⬡' },
            { label: 'Critical Priority PRs', value: criticalCount, color: '#fbbf24', icon: '▲' },
            { label: 'Blocked Dependency PRs', value: blockedCount, color: '#f87171', icon: '◈' },
            { label: 'Avg Priority Score', value: `${avgPriority}/100`, color: '#22d3ee', icon: '△' },
          ].map((s, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: 12, borderColor: `${s.color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-40)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: s.color, fontSize: '1.1rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Prioritized PRs */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="display-md" style={{ fontSize: '1.25rem', margin: 0 }}>Prioritized Pull Requests</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', margin: '0.25rem 0 0' }}>Click any PR to open details analyzer</p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '0.25rem 0.5rem', borderRadius: 6, background: 'rgba(255,255,255,0.03)', color: 'var(--text-40)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  Priority-Ranked Queue
                </span>
              </div>

              <div ref={queueRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredPRs.map(pr => (
                  <div
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className="glass-md"
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      borderColor: `${PRIORITY_COLORS[pr.priority]}1c`,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = `${PRIORITY_COLORS[pr.priority]}44`
                      e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 10px ${PRIORITY_COLORS[pr.priority]}15`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.borderColor = `${PRIORITY_COLORS[pr.priority]}1c`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: `${PRIORITY_COLORS[pr.priority]}12`,
                      border: `1px solid ${PRIORITY_COLORS[pr.priority]}30`,
                      color: PRIORITY_COLORS[pr.priority],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem',
                      flexShrink: 0
                    }}>
                      {pr.priorityScore}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--blue-300)' }}>#{pr.id}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-40)' }}>
                        <span className="tag tag-blue" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>{pr.repo}</span>
                        <span>by {pr.author}</span>
                        <span>•</span>
                        <span>{pr.age}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
                      <span className="tag" style={{ color: STATUS_COLORS[pr.status], borderColor: `${STATUS_COLORS[pr.status]}25`, background: `${STATUS_COLORS[pr.status]}0c`, fontSize: '0.65rem' }}>{pr.status}</span>
                      <span style={{ fontSize: '0.6rem', color: CI_COLORS[pr.ciStatus] }}>
                        CI: {pr.ciStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependency Chains */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 16 }}>
              <h2 className="display-md" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Detected Dependency Chains</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-40)', marginBottom: '1.5rem' }}>Cross-PR blocking paths identified in the repository dataset.</p>

              {filteredPRs.filter(p => p.status === 'Blocked').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredPRs.filter(p => p.status === 'Blocked').map((pr, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPR(pr)}
                      className="glass-md"
                      style={{
                        padding: '1.25rem',
                        borderRadius: 12,
                        borderLeft: '4px solid #fbbf24',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Blocked Pull Request #{pr.id}</span>
                        <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>Est. Delay: 2.4 days</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-60)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                        {pr.desc}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-40)' }}>Upstream blocker:</span>
                        {pr.dependencies.blocking.map(bId => (
                          <span key={bId} className="tag tag-red" style={{ fontSize: '0.625rem' }}>PR #{bId}</span>
                        ))}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-40)', marginLeft: '0.5rem' }}>Downstream blocked:</span>
                        {pr.dependencies.blocked.map(bId => (
                          <span key={bId} className="tag tag-blue" style={{ fontSize: '0.625rem' }}>PR #{bId}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-40)', fontSize: '0.85rem' }}>
                  No active blocking dependency chains found in this repository scope.
                </div>
              )}
            </div>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Reviewers */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 16 }}>
              <h2 className="display-md" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reviewer Workloads</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '1.5rem' }}>Current review queues and load balance</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {repoReviewers.map((rev, i) => {
                  const isOverload = rev.status === 'overloaded'
                  const barColor = isOverload ? '#f87171' : rev.status === 'busy' ? '#fbbf24' : '#34d399'
                  return (
                    <div key={i} className="reviewer-card glass-md" style={{ borderRadius: 12, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="reviewer-avatar" style={{
                        width: 30, height: 30, fontSize: '0.7rem',
                        background: isOverload ? 'rgba(248,113,113,0.12)' : rev.status === 'busy' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                        border: `1px solid ${isOverload ? 'rgba(248,113,113,0.25)' : rev.status === 'busy' ? 'rgba(251,191,36,0.22)' : 'rgba(52,211,153,0.2)'}`,
                        color: barColor,
                      }}>
                        {rev.initials}
                      </div>
                      <div>
                        <div className="reviewer-name" style={{ fontSize: '0.78rem' }}>{rev.name}</div>
                        <div className="reviewer-role" style={{ fontSize: '0.65rem' }}>{rev.role}</div>
                      </div>
                      <div className="load-bar-wrap" style={{ width: 50 }}>
                        <div className="load-pct" style={{ fontSize: '0.7rem', color: barColor }}>{rev.load}%</div>
                        <div className="load-bar-track" style={{ height: 2, marginTop: 2 }}>
                          <div className="load-bar-fill" style={{ width: `${rev.load}%`, background: barColor }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Smart recommendations */}
            <div className="glass" style={{ padding: '1.5rem 1.75rem', borderRadius: 16, background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(34,211,238,0.03) 100%)', borderColor: 'rgba(59,130,246,0.15)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', textAlign: 'left' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(34,211,238,0.1)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cyan-400)', fontSize: '0.9rem', flexShrink: 0
                }}>
                  💡
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem' }}>AI Queue Rebalancing</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-60)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    The priority engine detects reviewer queues that exceed safe review cycle targets and automatically recommends alternative assignees.
                  </p>
                  <div style={{ background: 'rgba(2,4,7,0.35)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>Recommendation</div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-80)', margin: 0, lineHeight: 1.4 }}>
                      Route PR #4521 assignments to <strong>Sam Rivera</strong> to reduce Alex Chen's 94% reviewer bottleneck.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Callout */}
        <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3.5rem 2.5rem', background: 'linear-gradient(135deg, rgba(8,14,28,0.7) 0%, rgba(34,211,238,0.02) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Integrate with Your Repository</h2>
          <p className="body-md" style={{ maxWidth: 500, margin: '0 auto 2rem' }}>
            Get continuous real-time priority scores and automated blocker detection directly inside your code review cycles.
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Integrate GitHub</Link>
            <Link to="/docs" className="btn btn-outline-glow btn-lg">Read Docs</Link>
          </div>
        </div>
      </div>

      {/* Slide Out PR Inspector Drawer */}
      <PRInspectorDrawer pr={selectedPR} onClose={() => setSelectedPR(null)} />
    </div>
  )
}
