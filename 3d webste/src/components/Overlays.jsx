import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'

/* ── Animated number counter ──────────────────── */
function Counter({ to, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          // ease-out-expo
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
          setVal(Math.round(ease * to))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, duration])

  return <span ref={ref}>{val}{suffix}</span>
}

/* ── Animate-in wrapper on scroll ────────────── */
function Reveal({ children, delay = 0, dir = 'up', className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const transforms = { up: 'translateY(28px)', down: 'translateY(-28px)', left: 'translateX(-28px)', right: 'translateX(28px)' }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : (transforms[dir] || transforms.up),
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────── *
 *  SECTION 1 — Hero / Chaos                       *
 * ─────────────────────────────────────────────── */
function Scene1() {
  return (
    <section
      id="scene-chaos"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '80px 2rem 4rem',
      }}
    >
      {/* Floating status chips — top left */}
      <Reveal delay={800} dir="left" className="" style={{}}>
        <div style={{
          position: 'absolute', top: '28%', left: '5%',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          pointerEvents: 'none',
        }}>
          <div className="tag tag-red">
            <span className="tag-dot" style={{ background: '#f87171' }} />
            34 PRs awaiting review
          </div>
          <div className="tag tag-amber">
            <span className="tag-dot" style={{ background: '#fbbf24' }} />
            review_queue: critical
          </div>
          <div className="tag" style={{ animationDelay: '200ms' }}>
            <span className="tag-dot" style={{ background: '#8b5cf6' }} />
            priority: unknown
          </div>
        </div>
      </Reveal>

      {/* Floating status chips — top right */}
      <div style={{
        position: 'absolute', top: '25%', right: '5%',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        pointerEvents: 'none',
      }}>
        <Reveal delay={1000} dir="right">
          <div className="tag tag-red">
            <span className="tag-dot" style={{ background: '#f87171' }} />
            12 PRs blocked
          </div>
        </Reveal>
        <Reveal delay={1150} dir="right">
          <div className="tag tag-amber">
            <span className="tag-dot" style={{ background: '#fbbf24' }} />
            3 overloaded reviewers
          </div>
        </Reveal>
        <Reveal delay={1300} dir="right">
          <div className="tag tag-purple">
            <span className="tag-dot" style={{ background: '#a855f7' }} />
            dependency graph: missing
          </div>
        </Reveal>
      </div>

      {/* Hero headline — center */}
      <div className="hero-block" style={{ position: 'relative', zIndex: 5 }}>
        <Reveal delay={200}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span className="eyebrow">
              <span className="eyebrow-pulse" />
              Engineering Intelligence Platform
            </span>
          </div>
        </Reveal>

        <Reveal delay={350}>
          <h1 className="display-xl" style={{ marginBottom: '0' }}>
            Pull Requests<br />
            <span className="grad-blue-cyan">Shouldn't Be</span><br />
            a Bottleneck
          </h1>
        </Reveal>

        <Reveal delay={500}>
          <p className="body-lg" style={{ maxWidth: 520, margin: '1.5rem auto 0' }}>
            Engineering teams lose entire sprints to unreviewed code, invisible
            dependency chains, and reviewer burnout. There's a better way.
          </p>
        </Reveal>

        <Reveal delay={650}>
          <div className="metrics-row">
            <div className="metric">
              <div className="metric-num"><Counter to={4} suffix=".2×" /></div>
              <div className="metric-label">Avg review delay increase</div>
            </div>
            <div className="metric-divider" />
            <div className="metric">
              <div className="metric-num"><Counter to={67} suffix="%" /></div>
              <div className="metric-label">PRs blocked by dependencies</div>
            </div>
            <div className="metric-divider" />
            <div className="metric">
              <div className="metric-num"><Counter to={3} suffix=".8d" /></div>
              <div className="metric-label">Mean time to merge</div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={800}>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/analysis-demo" id="hero-demo-btn" className="btn btn-primary btn-lg">
              See How It Works
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/analysis-demo" className="btn btn-outline-glow btn-lg">Watch Demo</Link>
          </div>
        </Reveal>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: '2.5rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        opacity: 0.55, animation: 'fadeIn 1s ease 2s both',
      }}>
        <div style={{
          width: 22, height: 34,
          border: '1.5px solid rgba(255,255,255,0.3)',
          borderRadius: 11,
          display: 'flex', justifyContent: 'center', paddingTop: 5,
        }}>
          <div style={{
            width: 3, height: 7,
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 2,
            animation: 'wheelScroll 1.8s ease-in-out infinite',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-40)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Scroll to explore
        </span>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────── *
 *  SECTION 2 — GitHub Integration                 *
 * ─────────────────────────────────────────────── */
function Scene2() {
  return (
    <section id="scene-github" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 2rem 8%',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 700 }}>
        <Reveal delay={0}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.125rem' }}>
            <span className="eyebrow">
              <span className="eyebrow-pulse" />
              GitHub Integration
            </span>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="display-lg" style={{ marginBottom: '1rem' }}>
            Connect Your Entire<br />
            <span className="grad-blue-cyan">Engineering Workflow</span>
          </h2>
        </Reveal>
        <Reveal delay={240}>
          <p className="body-lg" style={{ maxWidth: 520, margin: '0 auto 1.75rem' }}>
            PRFlow connects to GitHub Organizations in minutes — streaming pull
            request events, review signals, and dependency data in real time.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div className="tags-row" style={{ justifyContent: 'center' }}>
            <span className="tag tag-blue">
              <span className="tag-dot" style={{ background: '#60a5fa' }} />
              REST API + Webhooks
            </span>
            <span className="tag tag-cyan">
              <span className="tag-dot" style={{ background: '#22d3ee' }} />
              GraphQL Sync
            </span>
            <span className="tag tag-purple">
              <span className="tag-dot" style={{ background: '#a855f7' }} />
              Real-time Events
            </span>
            <span className="tag tag-green">
              <span className="tag-dot" style={{ background: '#34d399' }} />
              OAuth 2.0 Secure
            </span>
          </div>
        </Reveal>

        {/* Integration stats */}
        <Reveal delay={480}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginTop: '2rem',
          }}>
            {[
              { num: '< 5min', label: 'Setup time' },
              { num: '99.9%', label: 'API uptime' },
              { num: '< 30s', label: 'Event latency' },
            ].map((s, i) => (
              <div key={i} className="glass" style={{ padding: '1rem', textAlign: 'center', borderRadius: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.375rem', fontWeight: 700,
                  letterSpacing: '-0.04em',
                  background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {s.num}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────── *
 *  SECTION 3 — Dependency Discovery               *
 * ─────────────────────────────────────────────── */
function Scene3() {
  return (
    <section id="scene-dependencies" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'flex-end',
      padding: '80px 5% 4rem',
    }}>
      <div style={{ maxWidth: 400 }}>
        <Reveal delay={0} dir="right">
          <span className="eyebrow" style={{ marginBottom: '1.125rem' }}>
            <span className="eyebrow-pulse" />
            Tactile Navigation
          </span>
        </Reveal>
        <Reveal delay={120} dir="right">
          <h2 className="display-md" style={{ marginBottom: '1rem' }}>
            Tactile Pull<br />
            <span className="grad-blue-cyan">Request Control</span>
          </h2>
        </Reveal>
        <Reveal delay={240} dir="right">
          <p className="body-md" style={{ marginBottom: '1.5rem' }}>
            The PRFlow Hardware Controller provides tactile precision. Scrub through code changes using the anodized aluminum rotary dial, and perform review actions instantly with hot-swappable mechanical switches.
          </p>
        </Reveal>

        {/* Controller Specs */}
        <Reveal delay={360} dir="right">
          <div className="glass-md" style={{ padding: '1.25rem 1.375rem', borderRadius: 14, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Hardware Specifications
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-60)' }}>Connection</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>USB-C / Plug-and-Play</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-60)' }}>Scrub Dial</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>CNC-Aluminum Optical Encoder</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-60)' }}>Key Switches</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>Cherry MX Tactile (Hot-Swap)</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Feature bullets */}
        <Reveal delay={480} dir="right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '◎', text: 'Scrub through file diffs with frame-by-frame precision', color: '#22d3ee' },
              { icon: '◈', text: 'Dedicated physical keys for Approve, Request Changes, and Merge', color: '#3b82f6' },
              { icon: '△', text: 'Sturdy CNC-milled casing fits beautifully on your desk', color: '#a855f7' },
            ].map((f, i) => (
              <div key={i} className="glass" style={{
                padding: '0.75rem 1rem', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ color: f.color, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Scene4() {
  return (
    <section id="scene-reviewers" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '80px 5% 4rem',
    }}>
      <div style={{ maxWidth: 420 }}>
        <Reveal delay={0} dir="left">
          <span className="eyebrow" style={{ marginBottom: '1.125rem' }}>
            <span className="eyebrow-pulse" />
            OLED & RGB Status
          </span>
        </Reveal>
        <Reveal delay={120} dir="left">
          <h2 className="display-md" style={{ marginBottom: '1rem' }}>
            Always-On<br />
            <span className="grad-blue-cyan">OLED Display</span>
          </h2>
        </Reveal>
        <Reveal delay={240} dir="left">
          <p className="body-md" style={{ marginBottom: '1.5rem' }}>
            The integrated high-contrast micro-OLED screen displays active pull request metadata, priority scores, and test run statuses in real-time, accompanied by multi-zone RGB notification lights.
          </p>
        </Reveal>

        {/* OLED Screen simulation */}
        <Reveal delay={360} dir="left">
          <div className="glass-md" style={{ padding: '1.25rem 1.375rem', borderRadius: 14, marginBottom: '1.25rem', background: 'rgba(2,4,7,0.9)', border: '1px solid rgba(34,211,238,0.25)', boxShadow: '0 0 20px rgba(34,211,238,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--cyan-400)', fontWeight: 700, letterSpacing: '0.05em' }}>PRFLOW CONSOLE v1.0</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fff', lineHeight: 1.6 }}>
              <div>[PR #4521] Migrate auth to Redis</div>
              <div style={{ color: 'var(--text-40)' }}>Repo: vercel/next.js | Score: 98</div>
              <div style={{ color: '#fbbf24' }}>Status: BLOCKED BY UPSTREAM PR #4498</div>
              <div style={{ color: '#fca5a5' }}>CI: 3/4 checks passed (SonarQube failed)</div>
            </div>
          </div>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { icon: '◎', text: 'Syncs metadata and priority scores automatically via GitHub', color: '#22d3ee' },
            { icon: '◈', text: 'RGB zones glow amber/red for critical blockers and failed builds', color: '#3b82f6' },
            { icon: '△', text: 'Displays reviewers currently assigned to your queue', color: '#a855f7' },
          ].map((f, i) => (
            <Reveal key={i} delay={480 + i * 80} dir="left">
              <div className="glass" style={{
                padding: '0.75rem 1rem', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ color: f.color, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{f.text}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Scene5() {
  return (
    <section id="scene-priority" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'flex-end',
      padding: '80px 5% 4rem',
    }}>
      <div style={{ maxWidth: 440 }}>
        <Reveal delay={0} dir="right">
          <span className="eyebrow" style={{ marginBottom: '1.125rem' }}>
            <span className="eyebrow-pulse" />
            Haptic Engine
          </span>
        </Reveal>
        <Reveal delay={120} dir="right">
          <h2 className="display-md" style={{ marginBottom: '1rem' }}>
            Silent Haptic<br />
            <span className="grad-blue-cyan">Blocker Alerts</span>
          </h2>
        </Reveal>
        <Reveal delay={240} dir="right">
          <p className="body-md" style={{ marginBottom: '1.5rem' }}>
            Built-in dual vibration motors alert you with distinct haptic patterns the moment a dependency is resolved or when a merge cycle completes, keeping you informed without distracting notifications.
          </p>
        </Reveal>

        {/* Haptic Alert Patterns */}
        <Reveal delay={280} dir="right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { pattern: 'Single Long Pulse', alert: 'PR Unblocked / Ready', color: '#34d399' },
              { pattern: 'Double Short Pulse', alert: 'CI Run Failed / Warning', color: '#f87171' },
              { pattern: 'Pulsing Vibration', alert: 'Priority Score Escalated', color: '#fbbf24' },
            ].map((p, i) => (
              <div key={i} className="glass-md" style={{ padding: '0.75rem 1rem', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>{p.pattern}</span>
                <span className="tag" style={{ color: p.color, borderColor: `${p.color}35`, background: `${p.color}10`, fontSize: '0.65rem' }}>{p.alert}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={480} dir="right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '◎', text: 'Customize haptic feedback patterns per event type', color: '#22d3ee' },
              { icon: '◈', text: 'Zero desktop notification clutter — stay fully focused', color: '#3b82f6' },
              { icon: '△', text: 'Zero latency webhook processing driven by FastAPI', color: '#a855f7' },
            ].map((f, i) => (
              <div key={i} className="glass" style={{
                padding: '0.75rem 1rem', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ color: f.color, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-80)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────── *
 *  SECTION 6 — Full Platform + CTA               *
 * ─────────────────────────────────────────────── */
const FEATURES = [
  { icon: '⬡', name: 'GitHub Integration', sub: 'Org-wide sync in minutes' },
  { icon: '⟳', name: 'Dependency Graph',   sub: 'Real-time mapping'         },
  { icon: '◎', name: 'Reviewer Analytics', sub: 'Workload intelligence'      },
  { icon: '▲', name: 'Priority Engine',    sub: 'Priority-ranked review queue' },
  { icon: '◈', name: 'Slack + Jira',       sub: 'Seamless integrations'      },
  { icon: '△', name: 'Custom Policies',    sub: 'Rules as code'              },
]

function Scene6() {
  return (
    <section id="scene-platform" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 2rem 5rem',
    }}>
      <div className="cta-wrapper">
        <Reveal delay={0}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cta-badge">
              <svg width="7" height="7" viewBox="0 0 7 7">
                <circle cx="3.5" cy="3.5" r="3.5" fill="#3b82f6"/>
              </svg>
              Now in General Availability — 500+ engineering teams
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <h1 className="display-cta" style={{ marginBottom: '0' }}>
            Engineering<br />
            <span className="grad-blue-cyan">Workflow</span><br />
            Intelligence
          </h1>
        </Reveal>

        <Reveal delay={280}>
          <p className="body-lg" style={{ maxWidth: 540, margin: '1.5rem auto 0', color: 'var(--text-60)' }}>
            Transform pull request chaos into actionable insights. Know what to
            review, who to assign, and what to ship — automatically.
          </p>
        </Reveal>

        <Reveal delay={400}>
          <div className="cta-actions" style={{ marginTop: '2.25rem' }}>
            <Link to="/register" id="cta-primary-btn" className="btn btn-primary btn-xl">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2l6 3.5-6 3.5-6-3.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M2 9.5l6 3.5 6-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Request Demo
            </Link>
            <Link to="/analysis-demo" id="cta-secondary-btn" className="btn btn-outline-glow btn-xl">
              Explore Platform
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div className="social-proof-row">
            <span>SOC 2 Type II</span>
            <span className="sp-sep" />
            <span>GitHub Marketplace</span>
            <span className="sp-sep" />
            <span>GDPR Compliant</span>
            <span className="sp-sep" />
            <span>99.9% uptime SLA</span>
            <span className="sp-sep" />
            <span>24/7 Enterprise Support</span>
          </div>
        </Reveal>

        {/* Feature grid */}
        <Reveal delay={620}>
          <div className="feature-grid" style={{ marginTop: '2.5rem' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-cell glass" style={{ borderRadius: 12 }}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-sub">{f.sub}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Logos / social proof */}
        <Reveal delay={750}>
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem 2rem',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-4)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Trusted by engineering teams at
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.4 }}>
              {['Stripe', 'Vercel', 'Linear', 'Datadog', 'GitHub', 'Figma'].map((name) => (
                <span key={name} style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700, fontSize: '0.9375rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-100)',
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────── *
 *  SCROLL PROGRESS DOTS                           *
 * ─────────────────────────────────────────────── */
const SCENES = [
  { id: 'scene-chaos',        label: 'Engineering Chaos' },
  { id: 'scene-github',       label: 'GitHub Integration' },
  { id: 'scene-dependencies', label: 'Dependency Discovery' },
  { id: 'scene-reviewers',    label: 'Reviewer Intelligence' },
  { id: 'scene-priority',     label: 'Priority Engine' },
  { id: 'scene-platform',     label: 'Platform Reveal' },
]

function ScrollDots({ activeScene }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="scroll-progress" role="navigation" aria-label="Section navigation">
      {SCENES.map((s, i) => (
        <button
          key={i}
          className={`sp-dot ${activeScene === i ? 'active' : ''}`}
          title={s.label}
          aria-label={`Go to ${s.label}`}
          onClick={() => scrollTo(s.id)}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────── *
 *  TOP PROGRESS BAR                               *
 * ─────────────────────────────────────────────── */
function ProgressBar({ progress }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', top: 60, left: 0, right: 0,
        height: 2, zIndex: 150,
        background: 'linear-gradient(90deg, #3b82f6, #22d3ee, #a855f7)',
        transformOrigin: 'left',
        transform: `scaleX(${progress})`,
        transition: 'transform 0.08s linear',
        boxShadow: '0 0 12px rgba(34,211,238,0.5)',
      }}
    />
  )
}

/* ─────────────────────────────────────────────── *
 *  MAIN EXPORT                                    *
 * ─────────────────────────────────────────────── */
export default function Overlays({ scrollProgress }) {
  const [activeScene, setActiveScene] = useState(0)

  useEffect(() => {
    const idx = Math.floor(scrollProgress * SCENES.length)
    setActiveScene(Math.min(idx, SCENES.length - 1))
  }, [scrollProgress])

  return (
    <>
      <ProgressBar progress={scrollProgress} />
      <ScrollDots activeScene={activeScene} />

      {/* HTML sections scroll normally over the fixed canvas */}
      <div style={{ position: 'relative', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Scene1 />
          <Scene2 />
          <Scene3 />
          <Scene4 />
          <Scene5 />
          <Scene6 />
        </div>
      </div>
    </>
  )
}
