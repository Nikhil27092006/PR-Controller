import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    id: 'pr-prioritization',
    icon: '▲',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.25)',
    title: 'PR Prioritization',
    tag: 'Core Engine',
    headline: 'Every PR gets a real-time score. Nothing critical slips through.',
    overview: 'Our priority engine analyzes every open PR and generates a real-time priority score (0–100) using a multifactorial model — factoring in blocking depth, queue age, reviewer availability, and business context.',
    benefits: ['Surface critical PRs before they block releases', 'Reduce average time-to-merge by 38%', 'Prevent review queue buildup across large teams'],
    stat: { value: '38%', label: 'faster merges' },
  },
  {
    id: 'dependency-intelligence',
    icon: '⬡',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)',
    title: 'Dependency Intelligence',
    tag: 'Graph Engine',
    headline: 'See the full chain. Unblock at the root.',
    overview: 'PRFlow automatically discovers cross-PR and cross-repository dependency chains. It visualizes blocking relationships in an interactive graph, highlights critical paths, and calculates cascade delays.',
    benefits: ['Catch blocking PR chains before merge conflicts', 'Annotate PRs with their downstream impact', 'Prioritize unblocking root-cause PRs first'],
    stat: { value: '4×', label: 'faster unblocking' },
  },
  {
    id: 'reviewer-analytics',
    icon: '◎',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.25)',
    title: 'Reviewer Analytics',
    tag: 'Load Balancer',
    headline: 'No more overloaded reviewers. Balance is automated.',
    overview: 'Real-time workload distribution across your full engineering team. PRFlow measures pending review counts, response time metrics, and overload status — and recommends optimal reviewer routing.',
    benefits: ['Prevent top reviewers becoming bottlenecks', 'Balance review load fairly across seniority', 'Track first-response times to improve culture'],
    stat: { value: '6h', label: 'avg time saved/week' },
  },
  {
    id: 'bottleneck-detection',
    icon: '◈',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.25)',
    title: 'Bottleneck Detection',
    tag: 'Insight Engine',
    headline: 'Systemic problems made visible. Then fixable.',
    overview: 'PRFlow continuously monitors your repository workflow and detects bottlenecks — reviewers who are consistently blocking approvals, PRs that are perpetually delayed, and patterns that slow velocity.',
    benefits: ['Get actionable weekly bottleneck reports', 'Identify systemic problems pre-sprint', 'Track per-repo vs org-wide patterns'],
    stat: { value: '52%', label: 'cycle time drop' },
  },
  {
    id: 'repository-insights',
    icon: '⟳',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    title: 'Repository Insights',
    tag: 'Health Score',
    headline: 'A–F scores for every repo. Know what needs attention.',
    overview: 'Deep per-repository health scores aggregating PR velocity, review coverage, merge frequency, and test coverage impact. Instantly compare repo health across your organization.',
    benefits: ['Score every repo on engineering health (A–F)', 'Drill into per-repo metrics without context switch', 'Track improvement over time with trend charts'],
    stat: { value: '12×', label: 'repos tracked' },
  },
  {
    id: 'engineering-metrics',
    icon: '△',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.25)',
    title: 'Engineering Metrics',
    tag: 'Analytics',
    headline: 'Data-driven velocity. Not gut feelings.',
    overview: 'Comprehensive trend analytics across PR creation rates, merge velocity, review time distributions, and blocker frequency — all filterable by team, repository, or time window.',
    benefits: ['Track engineering productivity week over week', 'Data-driven arguments for capacity changes', 'Set and measure goals against historical baselines'],
    stat: { value: '3×', label: 'reporting speed' },
  },
]

// ─── Floating Particles Grid Background ───────────────────────────────────────
function FloatingGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const particles = []
    const count = 35
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(34, 211, 238, 0.1)'
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw Cyber Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)'
      ctx.lineWidth = 1
      const size = 64
      for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw & Move Particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  )
}

// ─── Individual Mockup Animators ─────────────────────────────────────────────
function PrioritizationMock() {
  const [score, setScore] = useState(94)

  useEffect(() => {
    const interval = setInterval(() => {
      setScore(prev => {
        const offset = Math.random() > 0.5 ? 1 : -1
        const next = prev + offset
        return next >= 91 && next <= 98 ? next : prev
      })
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  const color = '#fbbf24'
  const radius = 40
  const circ = 2 * Math.PI * radius
  const pct = ((100 - score) / 100) * circ

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
      <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
          <circle cx="48" cy="48" r={radius} stroke={color} strokeWidth="6" fill="transparent"
                  strokeDasharray={circ} strokeDashoffset={pct} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{score}</span>
          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</span>
        </div>
      </div>
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {[
          { name: 'Dependency blocker depth', val: '+42', color: '#f87171' },
          { name: 'Reviewer workload queue age', val: '+28', color: '#fbbf24' },
          { name: 'Focused diff scale boost', val: '-10', color: '#34d399' }
        ].map((factor, i) => (
          <div key={i} className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{factor.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: factor.color }}>{factor.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DependencyMock() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
      <svg width="100%" height="100%" viewBox="0 0 320 220" style={{ overflow: 'visible' }}>
        <defs>
          <style>{`
            @keyframes lineFlow {
              to { stroke-dashoffset: -20; }
            }
            @keyframes nodePulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          `}</style>
        </defs>
        
        {/* Connection Paths */}
        <path d="M 50 110 L 130 60" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" style={{ animation: 'lineFlow 1.2s linear infinite' }} />
        <path d="M 50 110 L 130 160" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" style={{ animation: 'lineFlow 1.2s linear infinite' }} />
        <path d="M 130 60 L 250 110" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6 4" style={{ animation: 'lineFlow 1.2s linear infinite' }} />
        <path d="M 130 160 L 250 110" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6 4" style={{ animation: 'lineFlow 1.2s linear infinite' }} />

        {/* Nodes */}
        <g transform="translate(50, 110)">
          <circle r="18" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="2" style={{ transformOrigin: '0 0', animation: 'nodePulse 2s infinite ease-in-out' }} />
          <text dy="3.5" textAnchor="middle" fill="#fff" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>#4521</text>
        </g>

        <g transform="translate(130, 60)">
          <circle r="15" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5" />
          <text dy="3" textAnchor="middle" fill="rgba(255,255,255,0.7)" style={{ fontFamily: 'var(--font-mono)', fontSize: 8 }}>#4489</text>
        </g>

        <g transform="translate(130, 160)">
          <circle r="15" fill="rgba(168,85,247,0.15)" stroke="#a855f7" strokeWidth="1.5" />
          <text dy="3" textAnchor="middle" fill="rgba(255,255,255,0.7)" style={{ fontFamily: 'var(--font-mono)', fontSize: 8 }}>#4498</text>
        </g>

        <g transform="translate(250, 110)">
          <circle r="17" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="2" />
          <text dy="3.5" textAnchor="middle" fill="rgba(255,255,255,0.9)" style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>#4501</text>
        </g>
      </svg>
    </div>
  )
}

function ReviewerMock() {
  const [loads, setLoads] = useState([94, 48, 76])

  useEffect(() => {
    const interval = setInterval(() => {
      setLoads(prev => prev.map(l => {
        const diff = Math.floor(Math.random() * 5) - 2
        const next = l + diff
        return next >= 20 && next <= 100 ? next : l
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const names = ['Riley Morgan', 'Sam Rivera', 'Alex Chen']
  const statuses = ['overloaded', 'available', 'busy']
  const colors = ['#f87171', '#34d399', '#fbbf24']

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 1 }}>
      {names.map((name, i) => (
        <div key={i} className="glass" style={{ padding: '0.6rem 0.8rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${colors[i]}15`, border: `1px solid ${colors[i]}25`,
            color: colors[i],
            fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{name}</div>
            <div style={{ fontSize: '0.6rem', color: colors[i], textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{statuses[i]}</div>
          </div>
          <div style={{ width: 55, textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: colors[i] }}>{loads[i]}%</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
              <div style={{ width: `${loads[i]}%`, height: '100%', background: colors[i], transition: 'width 0.5s ease-out' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BottleneckMock() {
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['Webhook', 'FastAPI Queue', 'Analysis', 'Bottleneck'].map((step, i) => (
          <React.Fragment key={i}>
            <div className="glass" style={{
              padding: '0.4rem 0.6rem', borderRadius: 8, fontSize: '0.7rem',
              border: i === 3 ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(255,255,255,0.04)',
              background: i === 3 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.01)',
              color: i === 3 ? '#fca5a5' : 'rgba(255,255,255,0.5)',
              fontWeight: i === 3 ? 700 : 400,
              boxShadow: i === 3 && pulse ? '0 0 12px rgba(248,113,113,0.2)' : 'none',
              transition: 'all 0.5s ease'
            }}>{step}</div>
            {i < 3 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      
      <div className="glass" style={{ width: '100%', padding: '0.875rem', borderRadius: 12, border: '1px solid rgba(248,113,113,0.2)', background: 'linear-gradient(135deg, rgba(8,14,28,0.9) 0%, rgba(248,113,113,0.03) 100%)', display: 'flex', gap: '0.6rem' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
          ⚠️
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>Bottleneck Detected</div>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            Alex Chen is currently blocking 5 pull requests. Average queue age has exceeded 48 hours.
          </p>
        </div>
      </div>
    </div>
  )
}

function RepositoriesMock() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem', zIndex: 1 }}>
      <div className="glass" style={{ padding: '0.875rem', borderRadius: 12, border: '1px solid rgba(52,211,153,0.2)', background: 'linear-gradient(135deg, rgba(8,14,28,0.85) 0%, rgba(52,211,153,0.03) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>core-api</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Last synced: 2 min ago</div>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800,
          boxShadow: '0 0 12px rgba(52,211,153,0.15)',
        }}>
          A
        </div>
      </div>
      
      <svg width="100%" height="70" viewBox="0 0 300 70" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 0 50 Q 50 15 100 35 T 200 10 T 300 5 L 300 70 L 0 70 Z" fill="url(#chart-grad)" />
        <path d="M 0 50 Q 50 15 100 35 T 200 10 T 300 5" fill="none" stroke="#34d399" strokeWidth="2" />
        <line x1="0" y1="35" x2="300" y2="35" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
      </svg>
    </div>
  )
}

function MetricsMock() {
  const [sweepX, setSweepX] = useState(0)

  useEffect(() => {
    let start = null
    const speed = 0.05
    const step = (timestamp) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      setSweepX((elapsed * speed) % 280)
      requestAnimationFrame(step)
    }
    const handle = requestAnimationFrame(step)
    return () => cancelAnimationFrame(handle)
  }, [])

  const chartPoints = [
    { x: 20, y: 70, val: '4.8d' },
    { x: 80, y: 40, val: '3.2d' },
    { x: 140, y: 65, val: '4.1d' },
    { x: 200, y: 25, val: '1.9d' },
    { x: 260, y: 35, val: '2.5d' }
  ]

  let activePoint = chartPoints[0]
  let minDiff = 999
  chartPoints.forEach(p => {
    const diff = Math.abs(p.x - sweepX)
    if (diff < minDiff) {
      minDiff = diff
      activePoint = p
    }
  })

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Avg Time to Merge</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
          {activePoint ? activePoint.val : '2.4d'}
        </span>
      </div>

      <div style={{ position: 'relative', height: 100, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 280 100">
          <path d="M 20 70 L 80 40 L 140 65 L 200 25 L 260 35" fill="none" stroke="rgba(96,165,250,0.15)" strokeWidth="1.5" />
          <path d="M 20 70 L 80 40 L 140 65 L 200 25 L 260 35" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          <line x1={sweepX} y1="0" x2={sweepX} y2="100" stroke="rgba(96,165,250,0.3)" strokeWidth="1.2" strokeDasharray="3 2" />
          
          {activePoint && (
            <circle cx={activePoint.x} cy={activePoint.y} r="4.5" fill="#60a5fa" stroke="rgba(96,165,250,0.25)" strokeWidth="3" />
          )}
        </svg>
      </div>
    </div>
  )
}

function renderMockupContent(f) {
  switch (f.id) {
    case 'pr-prioritization':
      return <PrioritizationMock />
    case 'dependency-intelligence':
      return <DependencyMock />
    case 'reviewer-analytics':
      return <ReviewerMock />
    case 'bottleneck-detection':
      return <BottleneckMock />
    case 'repository-insights':
      return <RepositoriesMock />
    case 'engineering-metrics':
      return <MetricsMock />
    default:
      return null
  }
}

// ─── 3D Perspective Card Tilt ────────────────────────────────────────────────
function FeatureMockup({ f }) {
  const cardRef = useRef(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setCoords({ x, y })
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setCoords({ x: 0, y: 0 })
  }

  const rotateX = -coords.y * 12
  const rotateY = coords.x * 12
  const scale = isHovered ? 1.02 : 1

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: 20,
        border: `1px solid ${f.color}20`,
        background: `linear-gradient(135deg, rgba(8, 14, 28, 0.92) 0%, ${f.color}0a 100%)`,
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '4/3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        boxShadow: isHovered ? `0 20px 40px rgba(0,0,0,0.55), 0 0 30px ${f.color}20` : 'none',
        transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
        cursor: 'pointer'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${f.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
      
      {/* Spotlight follow glow */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          left: `${(coords.x + 0.5) * 100}%`,
          top: `${(coords.y + 0.5) * 100}%`,
          width: '240px',
          height: '240px',
          background: `radial-gradient(circle, ${f.color}1c 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
      )}

      {renderMockupContent(f)}
    </div>
  )
}

function StatCard({ value, label, color, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, delay, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
    )
  }, [delay])
  return (
    <div ref={ref} style={{
      background: `${color}0a`,
      border: `1px solid ${color}28`,
      borderRadius: 16,
      padding: '1.75rem 2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function FeatureRow({ f, idx }) {
  const rowRef = useRef(null)
  const imgRef = useRef(null)
  const textRef = useRef(null)
  const isEven = idx % 2 === 0

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 80%', once: true }
    })
    tl.fromTo(textRef.current,
      { opacity: 0, x: isEven ? -50 : 50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    ).fromTo(imgRef.current,
      { opacity: 0, x: isEven ? 50 : -50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
  }, [isEven])

  return (
    <div ref={rowRef} style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4rem',
      alignItems: 'center',
      padding: '5rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      direction: isEven ? 'ltr' : 'rtl',
    }}>
      {/* Text side */}
      <div ref={textRef} style={{ direction: 'ltr' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${f.color}15`, border: `1px solid ${f.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: f.color, fontSize: '1.125rem', fontFamily: 'var(--font-mono)',
            boxShadow: `0 0 20px ${f.glow}`,
          }}>{f.icon}</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: f.color, fontWeight: 600 }}>{f.tag}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.15, marginBottom: '0.875rem' }}>
          {f.headline}
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '1.75rem' }}>{f.overview}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {f.benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${f.color}18`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke={f.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual side */}
      <div ref={imgRef} style={{ direction: 'ltr' }}>
        <FeatureMockup f={f} />
      </div>
    </div>
  )
}

export default function Features() {
  const heroRef = useRef(null)
  const eyebrowRef = useRef(null)
  const h1Ref = useRef(null)
  const subRef = useRef(null)
  const ctaRef = useRef(null)
  const statsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = [eyebrowRef.current, h1Ref.current, subRef.current, ctaRef.current]
      // Defensive: if any ref is null, ensure refs are populated before running.
      // Without this, a render race would leave elements at opacity: 0
      // permanently and the user would see a blank black hero.
      if (targets.some((t) => !t)) {
        // Force everything to visible so the page never looks blank.
        targets.forEach((t) => { if (t) gsap.set(t, { opacity: 1, x: 0, y: 0 }) })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(eyebrowRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(h1Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
        .fromTo(subRef.current, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    }, heroRef)
    return () => ctx.revert()
  }, [])

  // Floating ambient lighting orbs
  useEffect(() => {
    const orb1 = document.getElementById('feat-orb-1')
    const orb2 = document.getElementById('feat-orb-2')
    if (orb1) gsap.to(orb1, { y: -40, x: 30, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    if (orb2) gsap.to(orb2, { y: 35, x: -25, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 })
  }, [])

  return (
    <div style={{ background: 'var(--bg-void)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <Navbar scrolled />
      <FloatingGrid />

      {/* Hero */}
      <div ref={heroRef} style={{ position: 'relative', paddingTop: 'calc(var(--nav-h) + 5rem)', paddingBottom: '5rem', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glowing orbs */}
        <div id="feat-orb-1" style={{ position: 'absolute', top: '10%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)', zIndex: 0 }} />
        <div id="feat-orb-2" style={{ position: 'absolute', top: '20%', right: '6%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)', zIndex: 0 }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '0 2rem', zIndex: 1 }}>
          <div ref={eyebrowRef}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, padding: '0.35rem 1rem', fontSize: '0.75rem', color: '#60a5fa', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
              Product Features
            </span>
          </div>

          <h1 ref={h1Ref} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', lineHeight: 1.05, margin: '1.5rem 0 1.25rem' }}>
            Built for engineering<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #22d3ee 50%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              teams that ship.
            </span>
          </h1>

          <p ref={subRef} style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2.5rem' }}>
            PRFlow gives you complete visibility into your PR workflow — dependencies, reviewer load, automated priority scoring. Everything your team needs to move faster.
          </p>

          <div ref={ctaRef} style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff', padding: '0.875rem 2rem', borderRadius: 12,
              fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none',
              boxShadow: '0 0 30px rgba(37,99,235,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(37,99,235,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 30px rgba(37,99,235,0.4)' }}
            >
              Get Started Free →
            </Link>
            <Link to="/docs" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)', padding: '0.875rem 2rem', borderRadius: 12,
              fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none',
              transition: 'background 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              View Docs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div ref={statsRef} style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem 6rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <StatCard value="38%" label="faster merges" color="#fbbf24" delay={0} />
          <StatCard value="2.4×" label="reviewer throughput" color="#22d3ee" delay={0.1} />
          <StatCard value="52%" label="cycle time reduction" color="#a855f7" delay={0.2} />
        </div>

        {/* Section divider label */}
        <div style={{ textAlign: 'center', padding: '4rem 0 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>Feature Deep-Dives</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>
      </div>

      {/* Feature rows */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 6rem', position: 'relative', zIndex: 1 }}>
        {FEATURES.map((f, i) => <FeatureRow key={f.id} f={f} idx={i} />)}
      </div>

      {/* Bottom CTA */}
      <BottomCTA />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  )
}

function BottomCTA() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } }
    )
  }, [])
  return (
    <div ref={ref} style={{ maxWidth: 800, margin: '0 auto 8rem', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
      <div style={{
        borderRadius: 24,
        padding: '4rem 3rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(168,85,247,0.08) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '1.25rem', fontWeight: 600 }}>
            ◈ Start Today
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: '1rem' }}>
            Ready to ship faster?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Connect your GitHub org in minutes. No credit card. No configuration required.
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', padding: '0.875rem 2.25rem', borderRadius: 12,
              fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}>
              Get Started Free
            </Link>
            <Link to="/contact" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.75)', padding: '0.875rem 2.25rem', borderRadius: 12,
              fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none',
            }}>
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
