import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { gsap } from 'gsap'

// ─── Navigation structure ────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Introduction',
    items: [
      { id: 'overview',           label: 'Overview' },
      { id: 'problem-statement',  label: 'Problem Statement' },
    ],
  },
  {
    group: 'Architecture',
    items: [
      { id: 'system-architecture', label: 'System Architecture' },
      { id: 'how-it-works',        label: 'How It Works' },
    ],
  },
  {
    group: 'Features',
    items: [
      { id: 'pr-prioritization',     label: 'PR Prioritization' },
      { id: 'dependency-intel',      label: 'Dependency Intelligence' },
      { id: 'reviewer-analytics',    label: 'Reviewer Analytics' },
      { id: 'repo-health',           label: 'Repository Health' },
    ],
  },
  {
    group: 'Dashboard Modules',
    items: [
      { id: 'module-dashboard',    label: 'Dashboard' },
      { id: 'module-prs',          label: 'Pull Requests' },
      { id: 'module-pr-details',   label: 'PR Details' },
      { id: 'module-graph',        label: 'Dependency Graph' },
      { id: 'module-reviewers',    label: 'Reviewer Analytics' },
      { id: 'module-repos',        label: 'Repositories' },
      { id: 'module-settings',     label: 'Settings' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'tech-stack',     label: 'Technology Stack' },
      { id: 'api-reference',  label: 'API Reference' },
      { id: 'database',       label: 'Database Structure' },
      { id: 'security',       label: 'Security' },
    ],
  },
  {
    group: 'More',
    items: [
      { id: 'roadmap', label: 'Roadmap' },
      { id: 'faq',     label: 'FAQ' },
    ],
  },
]

const ALL_IDS = NAV.flatMap(g => g.items.map(i => i.id))

// ─── Primitives ──────────────────────────────────────────────────────────────
function Badge({ children, color = '#3b82f6' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.2rem 0.55rem',
      borderRadius: 5,
      fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: `${color}18`, color, border: `1px solid ${color}35`,
      fontFamily: 'var(--font-mono)',
    }}>
      {children}
    </span>
  )
}

function Method({ m }) {
  const C = { GET: '#34d399', POST: '#3b82f6', PUT: '#fbbf24', DELETE: '#f87171', PATCH: '#a855f7' }
  return <Badge color={C[m] || '#60a5fa'}>{m}</Badge>
}

function highlightCode(code, lang) {
  if (!code) return ''
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  if (lang === 'json') {
    escaped = escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, '<span style="color:#6ee7b7">$1</span>')
    escaped = escaped.replace(/: \b(true|false|null)\b/g, ': <span style="color:#60a5fa">$1</span>')
    escaped = escaped.replace(/: \b(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)\b/g, ': <span style="color:#c084fc">$1</span>')
  } else if (lang === 'bash' || lang === 'sql' || lang === 'example') {
    const keywords = ['curl', 'GET', 'POST', 'Authorization', 'Bearer', 'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'const', 'function', 'return', 'Dependency', 'PR', 'Root', 'Upstream', 'Downstream', 'Blocked']
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g')
      escaped = escaped.replace(regex, `<span style="color:#93c5fd;font-weight:700">$1</span>`)
    })
  }
  return escaped
}

function Code({ children, lang = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div style={{ position: 'relative', margin: '1.25rem 0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,4,7,0.9)', padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>{lang || 'code'}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : 'rgba(255,255,255,0.3)', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '1.125rem 1.25rem', background: 'rgba(2,4,7,0.75)', overflowX: 'auto' }}>
        <code
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#e2e8f0', lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: highlightCode(children, lang) }}
        />
      </pre>
    </div>
  )
}

function Callout({ type = 'note', children }) {
  const cfg = {
    note:    { color: '#3b82f6', icon: 'ℹ', label: 'Note' },
    tip:     { color: '#34d399', icon: '💡', label: 'Tip' },
    warning: { color: '#fbbf24', icon: '⚠', label: 'Warning' },
    danger:  { color: '#f87171', icon: '🚨', label: 'Important' },
  }[type] || { color: '#3b82f6', icon: 'ℹ', label: 'Note' }
  return (
    <div style={{ display: 'flex', gap: '0.875rem', background: `${cfg.color}08`, border: `1px solid ${cfg.color}25`, borderRadius: 8, padding: '1rem 1.125rem', margin: '1.25rem 0' }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1.5 }}>{cfg.icon}</span>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

function SectionHeading({ id, children, sub }) {
  return (
    <div style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <h1 id={id} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.625rem, 3vw, 2.125rem)', fontWeight: 700, letterSpacing: '-0.035em', color: '#fff', lineHeight: 1.15, marginBottom: sub ? '0.625rem' : 0 }}>
        {children}
      </h1>
      {sub && <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>{sub}</p>}
    </div>
  )
}

function H2({ id, children }) {
  return (
    <h2 id={id} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', margin: '2.5rem 0 1rem' }}>
      {children}
    </h2>
  )
}

function H3({ children }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)', margin: '1.75rem 0 0.75rem' }}>
      {children}
    </h3>
  )
}

function P({ children }) {
  return <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '1rem' }}>{children}</p>
}

function UL({ items }) {
  return (
    <ul style={{ paddingLeft: '1.25rem', margin: '0.75rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{it}</li>
      ))}
    </ul>
  )
}

function PropRow({ name, type, desc }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#93c5fd' }}>{name}</td>
      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#34d399' }}>{type}</td>
      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>{desc}</td>
    </tr>
  )
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', margin: '1rem 0 1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(2,4,7,0.6)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-mono)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => <PropRow key={i} name={row[0]} type={row[1]} desc={row[2]} />)}
        </tbody>
      </table>
    </div>
  )
}

function ArchBox({ label, sub, color = '#3b82f6', icon, children, isLeaf }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: isLeaf ? '0.625rem 1rem' : '1rem 1.25rem',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {icon && <span style={{ fontFamily: 'var(--font-mono)', color, fontSize: '1rem', flexShrink: 0 }}>{icon}</span>}
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: isLeaf ? '0.8125rem' : '0.9375rem', color: '#fff', letterSpacing: '-0.01em' }}>{label}</div>
            {sub && <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
          </div>
        </div>
        {children && <div style={{ marginTop: '0.875rem' }}>{children}</div>}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, color: 'rgba(255,255,255,0.2)' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v10M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function APIEndpoint({ method, path, purpose, request, response }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: '0.75rem', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '0.875rem 1.25rem',
          background: open ? 'rgba(255,255,255,0.04)' : 'rgba(2,4,7,0.4)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <Method m={method} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: '#e2e8f0', flex: 1 }}>{path}</span>
        <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>{purpose}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M2 5l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', background: 'rgba(2,4,7,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', paddingTop: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Request</div>
              <Code lang="bash">{request}</Code>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Response</div>
              <Code lang="json">{response}</Code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      gsap.fromTo(bodyRef.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' })
    } else {
      gsap.to(bodyRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' })
    }
  }, [open])

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: '0.625rem', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', gap: '1rem',
          background: 'rgba(2,4,7,0.3)', border: 'none', cursor: 'pointer', textAlign: 'left',
          outline: 'none'
        }}
      >
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-heading)' }}>{q}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0 }}>
          <path d="M2 5l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        ref={bodyRef}
        style={{
          height: 0, opacity: 0, overflow: 'hidden',
          background: 'rgba(255,255,255,0.01)',
          borderTop: open ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
          transition: 'border-color 0.3s'
        }}
      >
        <div style={{ padding: '0.875rem 1.25rem 1.125rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{a}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Section Content Components ───────────────────────────────────────────────
function SectionOverview() {
  return (
    <section>
      <SectionHeading id="overview" sub="GitHub-integrated workflow intelligence for engineering teams.">
        PRFlow Intelligence
      </SectionHeading>
      <P>PRFlow Intelligence is a GitHub-integrated workflow intelligence platform that helps engineering teams analyze pull requests, identify dependency bottlenecks, monitor reviewer workloads, prioritize critical pull requests, and improve repository visibility.</P>
      <P>The platform transforms raw GitHub activity into actionable engineering insights through automated analysis and visualization — giving teams a single pane of glass over their entire development workflow.</P>

      <H2>Key Benefits</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem', margin: '1rem 0 2rem' }}>
        {[
          { icon: '▲', color: '#fbbf24', title: 'PR Prioritization', desc: 'Algorithmic scoring surfaces critical PRs before they block releases.' },
          { icon: '⬡', color: '#3b82f6', title: 'Dependency Intelligence', desc: 'Auto-discover cross-PR blocking chains and cascade delays.' },
          { icon: '◎', color: '#22d3ee', title: 'Reviewer Analytics', desc: 'Real-time workload distribution with routing recommendations.' },
          { icon: '⟳', color: '#34d399', title: 'Repository Health', desc: 'Aggregate health scores across your entire organization.' },
          { icon: '△', color: '#60a5fa', title: 'Workflow Visibility', desc: 'Single pane of glass over all your engineering activity.' },
          { icon: '◈', color: '#a855f7', title: 'Engineering Insights', desc: 'Track velocity, review time, and bottleneck trends over time.' },
        ].map((b, i) => (
          <div key={i} style={{ background: `${b.color}08`, border: `1px solid ${b.color}22`, borderRadius: 10, padding: '1.125rem 1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: b.color, fontSize: '1.125rem', flexShrink: 0 }}>{b.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.2rem' }}>{b.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <Callout type="tip">
        PRFlow connects to your GitHub organization in under 5 minutes. No configuration files. No infrastructure to manage. Connect your org and start gaining insights immediately.
      </Callout>

      <H2>Quick Start</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '1rem 0' }}>
        {[
          { step: '01', title: 'Create an account', desc: 'Sign up at prflow.dev. No credit card required.' },
          { step: '02', title: 'Connect GitHub', desc: 'Authorize PRFlow via OAuth 2.0 — takes under 60 seconds.' },
          { step: '03', title: 'Select repositories', desc: 'Choose which repos to monitor. PRs sync automatically.' },
          { step: '04', title: 'View insights', desc: 'Your dashboard populates with live data within minutes.' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700, minWidth: 28, paddingTop: 2 }}>{s.step}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.2rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionProblem() {
  return (
    <section>
      <SectionHeading id="problem-statement" sub="The engineering workflow problems PRFlow Intelligence was built to solve.">
        Problem Statement
      </SectionHeading>
      <P>Modern software teams ship fast — but as repositories grow and engineering organizations scale, pull request workflows become increasingly difficult to manage. Teams face compounding problems that slow velocity, frustrate engineers, and introduce invisible risk into release pipelines.</P>

      <H2>The Core Challenges</H2>
      {[
        { color: '#f87171', title: 'PR Queue Overload', body: 'Large codebases accumulate dozens to hundreds of open pull requests. Without intelligent prioritization, engineers spend time reviewing low-impact changes while critical blockers age undetected.' },
        { color: '#fbbf24', title: 'Hidden Dependency Chains', body: 'Cross-PR dependencies are nearly impossible to track manually. A single blocked PR can cascade into delayed releases across multiple teams — and no one sees it coming until it\'s too late.' },
        { color: '#a855f7', title: 'Reviewer Overload', body: 'Senior engineers and domain experts become unwilling bottlenecks. They accumulate review queues that stretch into double-digit PR counts, creating response-time delays measured in days rather than hours.' },
        { color: '#fbbf24', title: 'Delayed Code Reviews', body: 'Without workload visibility, PR authors have no idea why their changes aren\'t being reviewed. Review SLAs are unenforceable and improvement is impossible to measure.' },
        { color: '#3b82f6', title: 'Lack of Repository Visibility', body: 'Engineering leaders lack a single view across repositories. Org-wide health, velocity trends, and bottleneck patterns are only discoverable through manual data pulls and spreadsheets.' },
        { color: '#f87171', title: 'Workflow Bottlenecks', body: 'Systemic review bottlenecks — the same reviewers blocking the same types of PRs week after week — are invisible without analytical tooling. They persist indefinitely because no one has the data to address them.' },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem', margin: '0 0 1rem', padding: '1.125rem 1.25rem', background: `${c.color}06`, border: `1px solid ${c.color}20`, borderRadius: 8 }}>
          <div style={{ width: 3, borderRadius: 2, background: c.color, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.9375rem', color: '#fff', marginBottom: '0.375rem' }}>{c.title}</div>
            <P>{c.body}</P>
          </div>
        </div>
      ))}

      <H2>How PRFlow Addresses These</H2>
      <P>PRFlow Intelligence connects directly to your GitHub organization and applies continuous automated analysis across all pull request activity. Rather than requiring engineers to build and maintain custom scripts, PRFlow delivers prioritization scores, dependency maps, and reviewer analytics in real-time — removing the need for any manual workflow management.</P>
      <Callout type="note">PRFlow does not require any changes to your existing GitHub workflows. It works entirely as a read layer on top of your existing repositories.</Callout>
    </section>
  )
}

function SectionArchitecture() {
  return (
    <section>
      <SectionHeading id="system-architecture" sub="How PRFlow Intelligence is structured across its layers.">
        System Architecture
      </SectionHeading>
      <P>PRFlow is built as a four-layer system: GitHub as the data source, a FastAPI backend as the processing engine, PostgreSQL as the persistence layer, and a React frontend as the interface. Each layer is independently scalable and communicates through well-defined API contracts.</P>

      <H2>Architecture Diagram</H2>
      <div style={{ background: 'rgba(2,4,7,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '2rem', margin: '1.25rem 0 2rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
          <ArchBox label="GitHub Repository" sub="Source of truth for all PR data" color="#6e40c9" icon="◼" />
          <Arrow />
          <ArchBox label="GitHub REST API" sub="OAuth 2.0 · Webhooks · Event Streaming" color="#6e40c9" icon="⬡" />
          <Arrow />
          <ArchBox label="FastAPI Backend" sub="Python 3.11 · Async · REST" color="#3b82f6" icon="△">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.625rem' }}>
              <ArchBox label="Dependency Analyzer" color="#f87171" isLeaf />
              <ArchBox label="Reviewer Analyzer" color="#fbbf24" isLeaf />
              <ArchBox label="Priority Engine" color="#34d399" isLeaf />
            </div>
          </ArchBox>
          <Arrow />
          <ArchBox label="PostgreSQL" sub="Relational · Persistent · Indexed" color="#22d3ee" icon="⟳" />
          <Arrow />
          <ArchBox label="Frontend Dashboard" sub="React · Vite · Real-time UI" color="#a855f7" icon="◎" />
        </div>
      </div>

      <H2>Layer Breakdown</H2>
      {[
        { layer: 'Data Source — GitHub', color: '#6e40c9', body: 'All data originates from your GitHub organization. PRFlow connects via GitHub OAuth 2.0, receiving both initial bulk sync data and real-time event updates via webhooks. Pull request metadata, reviewer assignments, labels, CI statuses, and comments are all collected.' },
        { layer: 'API Gateway — FastAPI Backend', color: '#3b82f6', body: 'The FastAPI backend is the central processing hub. It exposes a REST API consumed by the frontend and handles all business logic — including the analysis engine, webhook ingestion, GitHub sync scheduling, and database writes. FastAPI was chosen for its async performance and automatic OpenAPI documentation.' },
        { layer: 'Analysis Engine', color: '#60a5fa', body: 'Three independent analyzers run on every sync cycle. The Dependency Analyzer builds a directed acyclic graph of PR blocking relationships. The Reviewer Analyzer calculates per-reviewer load scores and response time metrics. The Priority Engine combines all signals into a normalized priority score (0–100) for every open PR.' },
        { layer: 'Database — PostgreSQL', color: '#22d3ee', body: 'All processed data is persisted to a PostgreSQL database. SQLAlchemy ORM models map to tables for PullRequests, Reviewers, Dependencies, and Repositories. Indexed queries enable fast dashboard loads even across large repository sets.' },
        { layer: 'Frontend — React Dashboard', color: '#a855f7', body: 'The React frontend communicates exclusively with the PRFlow backend API. No GitHub credentials or tokens are exposed to the frontend. The dashboard provides live-updating views of all analyzer outputs through purpose-built visualization modules.' },
      ].map((l, i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <H3><span style={{ color: l.color }}>→</span> {l.layer}</H3>
          <P>{l.body}</P>
        </div>
      ))}
    </section>
  )
}

function SectionHowItWorks() {
  return (
    <section>
      <SectionHeading id="how-it-works" sub="A step-by-step walkthrough of the PRFlow data pipeline.">
        How It Works
      </SectionHeading>

      {[
        {
          step: 1, color: '#3b82f6', title: 'Connect Repository',
          body: 'You navigate to the Repositories module and click Add Repository. PRFlow initiates an OAuth 2.0 authorization flow with GitHub. After you grant the required scopes, PRFlow stores your encrypted access token server-side and begins the initial repository onboarding sequence.',
        },
        {
          step: 2, color: '#22d3ee', title: 'GitHub Synchronization',
          body: 'On initial connection, PRFlow performs a bulk fetch of all open pull requests via the GitHub REST API. After the initial sync, a webhook is installed on your repository to receive real-time events within 30 seconds of any PR activity.',
          extra: (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {['Pull Requests', 'Reviewer Assignments', 'Labels', 'PR Metadata', 'CI Status Checks', 'Comments', 'Merge Status'].map((d, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 5, padding: '0.2rem 0.5rem' }}>{d}</span>
              ))}
            </div>
          ),
        },
        {
          step: 3, color: '#a855f7', title: 'Analysis Processing',
          body: 'After each sync, the analysis engine runs three parallel analyzers on the incoming data:',
          extra: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.75rem' }}>
              {[
                { name: 'Dependency Analysis', desc: 'Builds a directed graph of PR blocking relationships from PR body text, labels, and GitHub cross-references. Identifies root cause blockers and cascade chains.', color: '#f87171' },
                { name: 'Reviewer Analysis', desc: 'Calculates per-reviewer pending review count, average first-response time, and estimated availability. Generates load scores from 0–100%.', color: '#fbbf24' },
                { name: 'Priority Analysis', desc: 'Combines dependency depth, reviewer load, PR age, CI status, and diff size into a single normalized priority score (0–100) using configurable weight factors.', color: '#34d399' },
              ].map((a, i) => (
                <div key={i} style={{ background: `${a.color}07`, border: `1px solid ${a.color}20`, borderRadius: 8, padding: '0.875rem 1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: a.color, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>{a.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          ),
        },
        {
          step: 4, color: '#34d399', title: 'Database Storage',
          body: 'All processed outputs — priority scores, dependency relationships, reviewer load metrics — are written to PostgreSQL via SQLAlchemy ORM models. The schema is designed for fast aggregation queries, enabling dashboard loads in under 200ms even for organizations with hundreds of open PRs.',
        },
        {
          step: 5, color: '#fbbf24', title: 'Dashboard Visualization',
          body: 'The React frontend polls the backend API on a configurable interval and renders live data across all dashboard modules. Priority-sorted PR queues, interactive dependency graphs, reviewer workload cards, and engineering analytics charts all update automatically as new PR data arrives.',
        },
      ].map((s) => (
        <div key={s.step} style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${s.color}15`, border: `1.5px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, color: s.color, fontSize: '1rem' }}>
              {s.step}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <H3>{s.title}</H3>
            <P>{s.body}</P>
            {s.extra}
          </div>
        </div>
      ))}
    </section>
  )
}

function FeatureSection({ id, icon, color, title, sub, content }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: `${color}15`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', color, fontFamily: 'var(--font-mono)', flexShrink: 0, boxShadow: `0 0 24px ${color}20` }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color, marginBottom: '0.25rem', fontWeight: 500 }}>Feature</div>
          <h1 id={id} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>{title}</h1>
        </div>
      </div>
      <P>{sub}</P>
      {content}
    </section>
  )
}

function ModuleSection({ id, title, purpose, features, useCases }) {
  return (
    <section>
      <SectionHeading id={id} sub={purpose}>{title}</SectionHeading>
      <H2>Features</H2>
      <UL items={features} />
      <H2>Example Use Cases</H2>
      {useCases.map((u, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: '0.625rem' }}>
          <span style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>→</span>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{u}</span>
        </div>
      ))}
    </section>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Docs() {
  const [activeId, setActiveId] = useState('overview')
  const [search, setSearch] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const scrollToSection = useCallback((id) => {
    setActiveId(id)
    setMobileNavOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  const filteredNav = NAV.map(g => ({
    ...g,
    items: g.items.filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase())),
  })).filter(g => g.items.length > 0)

  const content = {
    'overview': <SectionOverview />,
    'problem-statement': <SectionProblem />,
    'system-architecture': <SectionArchitecture />,
    'how-it-works': <SectionHowItWorks />,

    'pr-prioritization': (
      <FeatureSection id="pr-prioritization" icon="▲" color="#fbbf24" title="PR Prioritization"
        sub="Every pull request in your connected repositories receives a real-time priority score from 0 to 100. The score is calculated by a configurable multi-factor engine and updated continuously as PR state changes."
        content={
          <>
            <H2>How Priority Scores Work</H2>
            <P>The priority engine combines five independent signals into a normalized score. Each signal carries a configurable weight — adjustable in the Settings module.</P>
            <Table
              headers={['Signal', 'Default Weight', 'Description']}
              rows={[
                ['Dependency Depth', '35%', 'PRs blocking downstream chains score higher. A PR blocking 3+ others scores near-maximum on this factor.'],
                ['Reviewer Load', '25%', 'PRs assigned to overloaded reviewers are surfaced earlier to trigger re-routing.'],
                ['PR Age', '10%', 'Older unreviewed PRs gradually increase in score to prevent indefinite deferral.'],
                ['CI/CD Status', '15%', 'PRs with passing CI score higher than those with broken or pending builds.'],
                ['Diff Size', '15%', 'Smaller, focused PRs receive a mild boost — they are faster to review and unblock.'],
              ]}
            />
            <H2>Priority Tiers</H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
              {[
                { label: 'Critical', range: '85–100', color: '#fbbf24', desc: 'Requires immediate attention. Likely blocking downstream work.' },
                { label: 'High', range: '65–84', color: '#60a5fa', desc: 'Should be reviewed within the current sprint cycle.' },
                { label: 'Medium', range: '40–64', color: '#a855f7', desc: 'Standard priority. Queue alongside other active work.' },
                { label: 'Low', range: '0–39', color: '#34d399', desc: 'No urgency. Review when bandwidth is available.' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: `${t.color}08`, border: `1px solid ${t.color}25`, borderRadius: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: t.color, fontWeight: 700, minWidth: 70 }}>{t.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', minWidth: 50 }}>{t.range}</span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>{t.desc}</span>
                </div>
              ))}
            </div>
            <Callout type="tip">Teams that implement PRFlow's priority queue report a 38% reduction in average time-to-merge for critical PRs within the first 30 days.</Callout>
          </>
        }
      />
    ),

    'dependency-intel': (
      <FeatureSection id="dependency-intel" icon="⬡" color="#3b82f6" title="Dependency Intelligence"
        sub="PRFlow automatically discovers blocking relationships between pull requests and visualizes them as an interactive dependency graph. Cascade delays and root cause blockers are identified before they impact releases."
        content={
          <>
            <H2>Dependency Detection</H2>
            <P>PRFlow parses PR body text, labels, and GitHub cross-references to identify blocking relationships. When PR A mentions PR B using GitHub's reference syntax, or a team uses blocking labels, PRFlow captures this relationship and propagates it through the dependency graph.</P>
            <H2>Blocking Chains</H2>
            <P>A blocking chain occurs when PR A → PR B → PR C. PRFlow surfaces the root of the chain (PR A) as the highest-priority unblocking target. Resolving a root blocker may unblock days of downstream work in a single merge.</P>
            <Code lang="example">{`Dependency Chain Detected:
  PR #4521 (Auth Refactor) ─blocks→ PR #4489 (API Gateway)
  PR #4489 (API Gateway)   ─blocks→ PR #4498 (Frontend)
  PR #4498 (Frontend)      ─blocks→ PR #4501 (Release)

Root blocker: PR #4521 — cascade delay estimated: ~2.4 days`}</Code>
            <H2>Graph Visualization</H2>
            <P>The Dependency Graph module renders all blocking relationships as an interactive force-directed graph. Nodes are color-coded by priority tier. Clicking any node navigates to that PR's detail view. Critical path nodes are highlighted with a pulsing ring.</P>
          </>
        }
      />
    ),

    'reviewer-analytics': (
      <FeatureSection id="reviewer-analytics" icon="◎" color="#22d3ee" title="Reviewer Analytics"
        sub="Real-time workload distribution across every reviewer in your organization. PRFlow tracks pending reviews, response times, and overload status — and generates intelligent reviewer routing recommendations."
        content={
          <>
            <H2>Load Score Calculation</H2>
            <P>Each reviewer receives a load score from 0–100% based on their pending review count relative to their historical throughput. The score accounts for PR complexity (diff size) and estimated review time.</P>
            <Table
              headers={['Status', 'Load Range', 'Behavior']}
              rows={[
                ['Available', '0–49%', 'Actively routing new PRs to this reviewer is safe.'],
                ['Busy', '50–79%', 'Can accept additional reviews but may experience delays.'],
                ['Overloaded', '80–100%', 'Routing new PRs here will increase average review delay significantly.'],
              ]}
            />
            <H2>AI Routing Recommendations</H2>
            <P>When a reviewer's load score exceeds 80%, PRFlow generates a routing recommendation — suggesting an alternative reviewer with domain overlap and lower current load. Recommendations appear at the top of the Reviewer Analytics module.</P>
            <H2>Review Time Metrics</H2>
            <UL items={[
              'First Response Time — time from PR open to first review comment or approval',
              'Cycle Time — time from first review to final approval or merge',
              'Abandonment Rate — percentage of assigned reviews that expire without action',
              'Weekly throughput — number of PRs reviewed per engineer per week',
            ]} />
          </>
        }
      />
    ),

    'repo-health': (
      <FeatureSection id="repo-health" icon="⟳" color="#34d399" title="Repository Health Monitoring"
        sub="Aggregate health scores for every connected repository, ranked A–F and trending over time. Instantly identify which repositories have workflow problems before they cause missed deadlines."
        content={
          <>
            <H2>Health Score Composition</H2>
            <Table
              headers={['Metric', 'Weight', 'Definition']}
              rows={[
                ['Open PR Count', '20%', 'Repositories with large PR backlogs score lower.'],
                ['Average Review Time', '30%', 'Mean time from PR creation to first review across all open PRs.'],
                ['Average Merge Time', '25%', 'Mean time from PR creation to successful merge.'],
                ['Blocked PR Ratio', '15%', 'Percentage of open PRs that are blocked by dependencies.'],
                ['CI Failure Rate', '10%', 'Percentage of PRs with failing or broken CI pipelines.'],
              ]}
            />
            <H2>Key Metrics Tracked</H2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
              {[
                { label: 'Open Pull Requests', value: 'Total open PRs', color: '#60a5fa' },
                { label: 'Blocked Pull Requests', value: 'PRs with blockers', color: '#f87171' },
                { label: 'Avg Review Time', value: 'Hours to first review', color: '#22d3ee' },
                { label: 'Avg Merge Time', value: 'Hours from open to merge', color: '#34d399' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '0.875rem 1rem', background: `${m.color}08`, border: `1px solid ${m.color}20`, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: m.color, fontWeight: 700, marginBottom: '0.2rem', fontFamily: 'var(--font-mono)' }}>{m.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>{m.value}</div>
                </div>
              ))}
            </div>
          </>
        }
      />
    ),

    'module-dashboard': (
      <ModuleSection id="module-dashboard" title="Dashboard Module" purpose="Command center view — aggregated metrics across all connected repositories."
        features={[
          'Real-time stat cards: Open PRs, Critical PRs, Blocked PRs, Repo Health Score, Avg Review Time, Avg Merge Time',
          'Critical PR queue — sorted by priority score, linked to PR Detail views',
          'Recent Activity feed — live event log with timestamps and actor context',
          'Workflow Health Summary — four health dimensions with trend indicators',
        ]}
        useCases={[
          'An engineering lead arrives Monday morning and immediately sees 3 critical PRs that emerged over the weekend.',
          'The dashboard flags 2 overloaded reviewers and a 4-node dependency chain — both requiring same-day action.',
          'A release manager checks the health summary before a Friday deploy and confirms CI stability is at 91%.',
        ]}
      />
    ),

    'module-prs': (
      <ModuleSection id="module-prs" title="Pull Requests Module" purpose="Full sortable, filterable table of all pull requests across connected repositories."
        features={[
          'Filterable by Priority, Status, and Repository simultaneously',
          'Sortable columns: PR #, Title, Priority Score, Repository, Author, Age, Review Count',
          'Priority score badges with visual tier indicators',
          'CI/CD status icons per PR — success, failed, pending',
          'Click-through to individual PR detail pages',
          'Footer summary cards: Critical+High count, Blocked count, Merged this sprint',
        ]}
        useCases={[
          'An engineer filters to Blocked + Critical to surface the highest-urgency unblocking work for the day.',
          'A team lead sorts by Priority Score descending and assigns the top 5 to available reviewers.',
          'A release manager filters to a specific repository to audit its PR health before a deploy.',
        ]}
      />
    ),

    'module-pr-details': (
      <ModuleSection id="module-pr-details" title="PR Details Module" purpose="Deep-dive analysis view for a single pull request."
        features={[
          'Full PR metadata: title, description, branch, base branch, additions/deletions',
          'Priority score display with tier badge and breakdown by contributing factor',
          'CI/CD run list — per-check status, name, duration, and error message',
          'Dependency analysis: PRs this blocks, PRs that block this',
          'Interactive timeline — create, review, comment, and CI events',
        ]}
        useCases={[
          'An engineer sees a PR scored 97 and opens the detail view to understand which dependency chain is contributing to the score.',
          'A reviewer checks CI status before starting review and sees two failed checks — flags for the author before wasting review time.',
          'A team lead uses the timeline to understand the full history of why a 6-day-old PR hasn\'t merged.',
        ]}
      />
    ),

    'module-graph': (
      <ModuleSection id="module-graph" title="Dependency Graph Module" purpose="Force-directed interactive graph of all PR blocking relationships."
        features={[
          'Force-directed node layout — automatically spaces nodes for readability',
          'Color-coded nodes by priority tier: Critical (gold), High (blue), Medium (purple), Ready (green)',
          'Click any node to navigate directly to that PR\'s detail view',
          'Pan and zoom — scroll to zoom, drag to pan',
          'Critical path highlighting — root blockers pulsed visually',
          'Cascade delay estimates displayed on hover',
        ]}
        useCases={[
          'A team discovers that one auth service PR is sitting at the root of a 5-PR cascade — resolving it unblocks 3 teams.',
          'An engineering manager uses the graph in a sprint review to visually explain why deploy velocity dropped.',
          'A developer uses the graph to verify their PR has no upstream dependencies before requesting review.',
        ]}
      />
    ),

    'module-reviewers': (
      <ModuleSection id="module-reviewers" title="Reviewer Analytics Module" purpose="Workload distribution and intelligent routing recommendations for all reviewers."
        features={[
          'Per-reviewer load score (0–100%) with color-coded status: Available / Busy / Overloaded',
          'Pending review count and average response time per reviewer',
          'AI routing recommendations — suggested re-assignments for overloaded reviewers',
          'Load bar visualization for at-a-glance workload comparison',
          'Top-level summary stats: total reviewers, overloaded count, available count, org-wide avg load',
        ]}
        useCases={[
          'A team lead sees Riley at 94% load and Casey at 28% — reassigns 2 PRs before a delayed review compounds.',
          'An organization identifies that 3 senior engineers are receiving 6× the review volume of mid-level engineers.',
          'After re-balancing, average first-response time drops from 8 hours to 1.5 hours within one sprint.',
        ]}
      />
    ),

    'module-repos': (
      <ModuleSection id="module-repos" title="Repositories Module" purpose="Connect, monitor, and manage all GitHub repositories linked to your organization."
        features={[
          'Repository list with sync status: synced, syncing, disconnected',
          'Per-repo open PR count and last-sync timestamp',
          'Add repository form — connect by owner/name',
          'Connect / Disconnect controls per repository',
          'Summary stats: connected repos, total PRs tracked, currently syncing',
        ]}
        useCases={[
          'A new engineer joins and connects 3 repositories in under 2 minutes using the Add Repository form.',
          'A team disconnects a deprecated repository to remove it from dashboard aggregations.',
          'An engineering lead checks that all 12 org repositories are synced before the weekly review meeting.',
        ]}
      />
    ),

    'module-settings': (
      <ModuleSection id="module-settings" title="Settings Module" purpose="Configure the priority engine weights, notification channels, and general platform behavior."
        features={[
          'Priority Engine tab — interactive sliders for all 5 scoring weight factors (total target: 100%)',
          'Notifications tab — toggle email digest, reviewer overload alerts, and dependency blocker alerts',
          'Slack webhook integration — configure webhook URL when Slack alerts are enabled',
          'General tab — toggle automated background sync, configure sync interval, select workspace theme',
        ]}
        useCases={[
          'A team that cares more about PR age than CI status adjusts weights to reflect their workflow priorities.',
          'An engineering lead enables Slack alerts for dependency blockers so their team is notified in-channel immediately.',
          'A large org sets sync interval to 5 minutes (real-time) to ensure priority scores update continuously throughout the day.',
        ]}
      />
    ),

    'tech-stack': (
      <section>
        <SectionHeading id="tech-stack" sub="The technologies that power PRFlow Intelligence and why they were chosen.">
          Technology Stack
        </SectionHeading>
        {[
          {
            layer: 'Frontend', color: '#a855f7',
            items: [
              { name: 'React', why: 'Component model enables independent, composable UI modules for each dashboard view. Virtual DOM ensures efficient updates when real-time PR data changes.' },
              { name: 'JavaScript (ES2022)', why: 'Maximizes tooling compatibility across the frontend ecosystem. TypeScript migration is on the roadmap.' },
              { name: 'Vite', why: 'Sub-second HMR development experience. Production builds are highly optimized with tree-shaking and code-splitting.' },
              { name: 'React Router v6', why: 'Client-side routing enables SPA navigation across all dashboard modules without full page reloads.' },
            ],
          },
          {
            layer: 'Backend', color: '#3b82f6',
            items: [
              { name: 'Python 3.11', why: 'Extensive data analysis ecosystem (pandas, networkx) and strong async support for high-throughput webhook ingestion.' },
              { name: 'FastAPI', why: 'Async request handling, automatic OpenAPI documentation, and Pydantic validation make it the ideal framework for a data-heavy REST API.' },
              { name: 'SQLAlchemy', why: 'ORM layer provides clean model definitions, migration support, and query optimization without raw SQL for every operation.' },
            ],
          },
          {
            layer: 'Database', color: '#22d3ee',
            items: [
              { name: 'PostgreSQL', why: 'ACID compliance guarantees data consistency during concurrent webhook ingestion. Advanced indexing supports fast aggregation queries across large PR datasets.' },
            ],
          },
          {
            layer: 'External Integration', color: '#34d399',
            items: [
              { name: 'GitHub REST API v3', why: 'Provides comprehensive access to PR metadata, reviewer assignments, labels, CI statuses, and comments. Webhook support enables real-time event delivery.' },
            ],
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: '2rem' }}>
            <H2>{section.layer}</H2>
            {section.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.125rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: '0.625rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: section.color, fontSize: '0.875rem', minWidth: 130, paddingTop: 1 }}>{item.name}</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{item.why}</span>
              </div>
            ))}
          </div>
        ))}
      </section>
    ),

    'api-reference': (
      <section>
        <SectionHeading id="api-reference" sub="REST API reference for all PRFlow Intelligence endpoints.">
          API Reference
        </SectionHeading>
        <Callout type="note">
          All API endpoints are served from <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#22d3ee' }}>https://api.prflow.dev/v1</code>. Authentication uses Bearer tokens in the <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#22d3ee' }}>Authorization</code> header.
        </Callout>
        <H2>Endpoints</H2>
        <APIEndpoint method="GET" path="/dashboard" purpose="Aggregate dashboard metrics"
          request={`curl -X GET https://api.prflow.dev/v1/dashboard \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "open_prs": 24,
  "critical_prs": 3,
  "blocked_prs": 5,
  "repo_health_score": 74,
  "avg_review_time_hours": 3.8,
  "avg_merge_time_days": 2.4
}`}
        />
        <APIEndpoint method="GET" path="/prs" purpose="List all pull requests"
          request={`curl -X GET "https://api.prflow.dev/v1/prs?priority=Critical&status=Blocked" \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "data": [
    {
      "id": "4521",
      "title": "feat: Auth service OAuth2 refactor",
      "repo": "core-api",
      "priority_score": 97,
      "priority": "Critical",
      "status": "Blocked",
      "author": "sarah.dev",
      "age": "4d",
      "review_count": 0,
      "ci_status": "success"
    }
  ],
  "total": 1,
  "page": 1
}`}
        />
        <APIEndpoint method="GET" path="/prs/{id}" purpose="Get single PR with full analysis"
          request={`curl -X GET https://api.prflow.dev/v1/prs/4521 \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "id": "4521",
  "title": "feat: Auth service OAuth2 refactor",
  "description": "Implements the new OAuth2 flow...",
  "priority_score": 97,
  "priority_breakdown": [
    { "factor": "Dependency Depth", "score": 38 },
    { "factor": "PR Age", "score": 22 },
    { "factor": "CI Status", "score": 15 }
  ],
  "dependencies": {
    "blocking": ["4489", "4498"],
    "blocked_by": []
  },
  "ci_runs": [
    { "name": "unit-tests", "status": "success", "duration": "2m 14s" }
  ]
}`}
        />
        <APIEndpoint method="GET" path="/dependencies" purpose="Dependency graph data"
          request={`curl -X GET https://api.prflow.dev/v1/dependencies \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "nodes": [
    { "id": "4521", "priority": "Critical", "score": 97, "repo": "core-api" },
    { "id": "4489", "priority": "High", "score": 78, "repo": "api-gateway" }
  ],
  "edges": [
    { "source": "4521", "target": "4489", "type": "blocks" }
  ]
}`}
        />
        <APIEndpoint method="GET" path="/reviewers" purpose="Reviewer analytics and load scores"
          request={`curl -X GET https://api.prflow.dev/v1/reviewers \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "data": [
    {
      "id": 1,
      "username": "riley.morgan",
      "name": "Riley Morgan",
      "load_score": 94,
      "status": "overloaded",
      "pending_reviews": 7,
      "avg_response_hours": 2.1
    }
  ]
}`}
        />
        <APIEndpoint method="GET" path="/repositories" purpose="List connected repositories"
          request={`curl -X GET https://api.prflow.dev/v1/repositories \\
  -H "Authorization: Bearer <token>"`}
          response={`{
  "data": [
    {
      "id": 1,
      "name": "core-api",
      "owner": "acme-org",
      "pr_count": 12,
      "status": "synced",
      "last_sync": "2024-01-15T10:30:00Z"
    }
  ]
}`}
        />
        <APIEndpoint method="POST" path="/repositories" purpose="Connect a new repository"
          request={`curl -X POST https://api.prflow.dev/v1/repositories \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"owner": "acme-org", "name": "new-service"}'`}
          response={`{
  "id": 5,
  "name": "new-service",
  "owner": "acme-org",
  "status": "syncing",
  "created_at": "2024-01-15T11:00:00Z",
  "message": "Repository queued for initial sync. ETA: ~60s"
}`}
        />
      </section>
    ),

    'database': (
      <section>
        <SectionHeading id="database" sub="Primary entities, field definitions, and entity relationships.">
          Database Structure
        </SectionHeading>
        <P>PRFlow uses PostgreSQL with SQLAlchemy ORM models. The schema is optimized for fast aggregation queries across large PR datasets and designed to support future analytical features.</P>

        {[
          { entity: 'PullRequest', color: '#fbbf24', fields: [['id', 'UUID', 'Primary key'], ['github_pr_number', 'INTEGER', 'GitHub PR number within repo'], ['title', 'TEXT', 'PR title'], ['description', 'TEXT', 'PR body / description'], ['status', 'ENUM', 'open, blocked, merged, closed'], ['priority_score', 'FLOAT', 'Calculated score 0–100'], ['priority_tier', 'ENUM', 'Critical, High, Medium, Low'], ['author', 'VARCHAR', 'GitHub username of PR author'], ['branch', 'VARCHAR', 'Source branch name'], ['additions', 'INTEGER', 'Lines added'], ['deletions', 'INTEGER', 'Lines removed'], ['ci_status', 'ENUM', 'success, failed, pending'], ['created_at', 'TIMESTAMP', 'PR creation timestamp'], ['updated_at', 'TIMESTAMP', 'Last event timestamp']] },
          { entity: 'Reviewer', color: '#22d3ee', fields: [['id', 'UUID', 'Primary key'], ['username', 'VARCHAR', 'GitHub username'], ['name', 'VARCHAR', 'Display name'], ['pending_reviews', 'INTEGER', 'Current pending review count'], ['load_score', 'FLOAT', 'Calculated load score 0–100'], ['status', 'ENUM', 'available, busy, overloaded'], ['avg_review_time_hours', 'FLOAT', 'Historical mean first-response time']] },
          { entity: 'Dependency', color: '#f87171', fields: [['id', 'UUID', 'Primary key'], ['source_pr_id', 'UUID FK', 'The PR that is blocking'], ['target_pr_id', 'UUID FK', 'The PR that is blocked'], ['detected_at', 'TIMESTAMP', 'When the dependency was first found']] },
          { entity: 'Repository', color: '#34d399', fields: [['id', 'UUID', 'Primary key'], ['name', 'VARCHAR', 'Repository name'], ['owner', 'VARCHAR', 'Organization or user owner'], ['github_repo_id', 'BIGINT', 'GitHub internal repo ID'], ['status', 'ENUM', 'synced, syncing, disconnected'], ['last_sync', 'TIMESTAMP', 'Last successful sync time'], ['pr_count', 'INTEGER', 'Current open PR count']] },
        ].map((e, i) => (
          <div key={i} style={{ marginBottom: '2.5rem' }}>
            <H2><span style={{ fontFamily: 'var(--font-mono)', color: e.color }}>Table:</span> {e.entity}</H2>
            <Table headers={['Column', 'Type', 'Description']} rows={e.fields} />
          </div>
        ))}

        <H2>Entity Relationships</H2>
        <Code lang="sql">{`-- PullRequest belongs to one Repository
PullRequest.repository_id → Repository.id

-- Dependency links two PullRequests
Dependency.source_pr_id → PullRequest.id  -- blocker
Dependency.target_pr_id → PullRequest.id  -- blocked

-- PullRequest has many Reviewers (join table)
PullRequestReviewer.pr_id       → PullRequest.id
PullRequestReviewer.reviewer_id → Reviewer.id

-- All entities scoped to an Organization
Organization.id referenced by Repository, Reviewer`}</Code>
      </section>
    ),

    'security': (
      <section>
        <SectionHeading id="security" sub="How PRFlow Intelligence protects your data and GitHub credentials.">
          Security
        </SectionHeading>
        <Callout type="warning">PRFlow never reads, stores, or transmits your source code. Only PR metadata is collected — titles, descriptions, reviewer assignments, labels, and CI statuses.</Callout>

        {[
          { title: 'GitHub Token Storage', color: '#3b82f6', body: 'GitHub access tokens are encrypted at rest using AES-256 and stored exclusively in the backend database. Tokens are never logged, never sent to the frontend, and rotated automatically when GitHub invalidates them.' },
          { title: 'Environment Variable Configuration', color: '#22d3ee', body: 'All secrets — database credentials, GitHub client secrets, encryption keys — are managed through environment variables. No secrets are hardcoded in source code or committed to version control.' },
          { title: 'Backend-Only GitHub API Access', color: '#a855f7', body: 'All GitHub API calls originate from the FastAPI backend. The React frontend never communicates directly with GitHub. This ensures no credentials are ever exposed in browser network traffic.' },
          { title: 'Minimum Required Scopes', color: '#34d399', body: 'PRFlow requests only the minimum GitHub OAuth scopes required: repo:read, pull_request:read, org:read, and webhook:write. Write access to code or issues is never requested.' },
          { title: 'No Source Code Access', color: '#fbbf24', body: 'PRFlow does not request or store any file content from your repositories. Only pull request-level metadata is collected. Your code remains entirely private.' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: '1.5rem' }}>
            <H3><span style={{ color: s.color }}>■</span> {s.title}</H3>
            <P>{s.body}</P>
          </div>
        ))}
      </section>
    ),

    'roadmap': (
      <section>
        <SectionHeading id="roadmap" sub="Planned features and improvements coming to PRFlow Intelligence.">
          Roadmap
        </SectionHeading>
        <P>The following features are actively in development or planned for future releases. The roadmap is updated quarterly based on user feedback.</P>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', margin: '1.5rem 0' }}>
          {[
            { label: 'In Progress', color: '#34d399', features: ['Automatic Dependency Detection from PR body text and GitHub references', 'Intelligent Reviewer Recommendations using algorithmic domain similarity scoring'] },
            { label: 'Planned — Q3', color: '#3b82f6', features: ['Predictive Review Delay Analysis — estimate how long a PR will take to get reviewed', 'Merge Time Prediction — analytical prediction of time-to-merge based on PR characteristics'] },
            { label: 'Planned — Q4', color: '#a855f7', features: ['Team Performance Insights — per-team velocity dashboards and comparative analytics', 'Advanced Engineering Analytics — DORA metrics, deployment frequency, change failure rate'] },
            { label: 'Future Consideration', color: '#fbbf24', features: ['GitLab integration', 'Bitbucket integration', 'Jira issue linking', 'Slack native app (not just webhooks)', 'GitHub Actions workflow analytics'] },
          ].map((phase, i) => (
            <div key={i} style={{ border: `1px solid ${phase.color}25`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: `${phase.color}10`, padding: '0.625rem 1.125rem', borderBottom: `1px solid ${phase.color}20` }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, color: phase.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{phase.label}</span>
              </div>
              <div style={{ padding: '0.75rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {phase.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                    <span style={{ color: phase.color, fontSize: '0.75rem', marginTop: 2, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ),

    'faq': (
      <section>
        <SectionHeading id="faq" sub="Answers to common questions about PRFlow Intelligence.">
          Frequently Asked Questions
        </SectionHeading>
        {[
          { q: 'How long does it take to connect a GitHub repository?', a: 'The OAuth authorization flow takes under 60 seconds. After authorization, PRFlow performs an initial bulk sync of your open PRs. For a repository with 100 open PRs, the initial sync typically completes in under 60 seconds. You\'ll see data in your dashboard within 2 minutes of connecting.' },
          { q: 'What GitHub permissions does PRFlow require?', a: 'PRFlow requests the minimum scopes necessary: repo:read (read PR data), pull_request:read (access PR details), org:read (list organization repositories), and webhook:write (install webhooks for real-time updates). Write access to code, issues, or organization settings is never requested.' },
          { q: 'Does PRFlow read my source code?', a: 'No. PRFlow only reads pull request metadata — titles, descriptions, reviewer assignments, labels, CI statuses, and branch names. File content, commit diffs beyond line count, and private comments are never accessed or stored.' },
          { q: 'How does the priority score algorithm work?', a: 'The priority score (0–100) is a weighted combination of five signals: dependency blocking depth (default 35%), reviewer workload (25%), CI/CD status (15%), PR diff size (15%), and PR age decay (10%). All weights are configurable in the Settings module. Scores update with every sync cycle.' },
          { q: 'How is dependency detection done?', a: 'PRFlow parses PR body text for GitHub cross-reference syntax (e.g., "blocked by #4521", "depends on #4489"), checks for commonly used blocking labels (configurable), and monitors GitHub\'s built-in cross-reference API. Detected dependencies are stored and visualized in the Dependency Graph module.' },
          { q: 'How frequently does PRFlow sync with GitHub?', a: 'PRFlow uses a dual-mode sync strategy. Webhooks deliver real-time event updates within 30 seconds of any PR activity. A background polling job also runs on a configurable interval (default: every 15 minutes) to catch any missed webhook events and perform full reconciliation.' },
          { q: 'Can I connect multiple GitHub organizations?', a: 'Yes. PRFlow supports multi-organization setups. Each organization requires its own OAuth authorization. All organizations appear in the same dashboard and contribute to aggregate analytics.' },
          { q: 'How are reviewer load scores calculated?', a: 'The load score (0–100%) is calculated from pending review count, weighted by estimated PR complexity (diff size), divided by that reviewer\'s historical throughput (PRs reviewed per week). A score above 80% triggers an "Overloaded" status and activates routing recommendations.' },
          { q: 'Is PRFlow free to use?', a: 'Yes — PRFlow Intelligence is completely free to use with no limits on repositories, users, or pull requests. Future paid tiers may be introduced for advanced analytics features, but the core workflow intelligence platform will remain free.' },
          { q: 'Where is my data stored?', a: 'PR metadata is stored in a PostgreSQL database hosted in a SOC 2-compliant cloud environment. GitHub access tokens are encrypted at rest using AES-256. No source code or personal developer data beyond GitHub username is stored.' },
          { q: 'What happens if a webhook fails to deliver?', a: 'PRFlow includes automatic webhook retry logic with exponential backoff. If a webhook event fails to deliver, PRFlow\'s background polling job will catch the change on its next run (default: every 15 minutes). Missed events are reconciled automatically.' },
          { q: 'Can I configure which PRs appear as "Critical"?', a: 'The priority threshold that determines Critical, High, Medium, and Low tiers is configurable. You can also adjust the weight factors in the priority engine to match your team\'s specific workflow priorities — for example, weighting PR age more heavily than diff size.' },
        ].map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
      </section>
    ),
  }

  const currentContent = content[activeId] || content['overview']

  const activeIndicatorRef = useRef(null)
  const navRef = useRef(null)
  const [h2s, setH2s] = useState([])

  // Dynamic headers collector
  useEffect(() => {
    const mainEl = contentRef.current
    if (mainEl) {
      const headings = Array.from(mainEl.querySelectorAll('h2')).map(h => {
        const id = h.id || h.innerText.toLowerCase().replace(/\s+/g, '-')
        h.id = id
        return { id, text: h.innerText.replace('Table: ', '').replace('→ ', '').replace('■ ', '') }
      })
      setH2s(headings)
    }
  }, [activeId])

  // Sliding active indicator
  useEffect(() => {
    const activeBtn = navRef.current?.querySelector('[data-active="true"]')
    if (activeBtn && activeIndicatorRef.current) {
      const parentRect = navRef.current.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      const relativeTop = btnRect.top - parentRect.top + navRef.current.scrollTop
      const height = btnRect.height

      gsap.to(activeIndicatorRef.current, {
        y: relativeTop,
        height: height,
        duration: 0.35,
        ease: 'power3.out'
      })
    }
  }, [activeId, search])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 90% 10%, rgba(34,211,238,0.06) 0%, transparent 50%), #020407',
    }}>
      <Navbar scrolled />

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(2, 4, 7, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
      )}

      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setMobileNavOpen(o => !o)}
        className="docs-mobile-trigger"
        aria-label="Toggle navigation menu"
      >
        {mobileNavOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      <div className="docs-container" style={{ paddingTop: 'var(--nav-h)' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`docs-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
          {/* Search */}
          <div style={{ padding: '0 1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search docs... (Press '/' to focus)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7, padding: '0.5rem 0.75rem 0.5rem 2.125rem',
                  color: '#fff', fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Nav groups */}
          <nav ref={navRef} style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
            {/* Sliding background/edge bubble bar */}
            <div
              ref={activeIndicatorRef}
              style={{
                position: 'absolute',
                left: 0,
                width: 3,
                background: 'linear-gradient(to bottom, #3b82f6, #22d3ee)',
                boxShadow: '0 0 10px rgba(34,211,238,0.5)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />

            {filteredNav.map(group => (
              <div key={group.group} style={{ marginBottom: '1.5rem' }}>
                <div style={{ padding: '0 1rem 0.375rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  {group.group}
                </div>
                {group.items.map(item => {
                  const isActive = activeId === item.id
                  return (
                    <button
                      key={item.id}
                      data-active={isActive ? 'true' : 'false'}
                      onClick={() => scrollToSection(item.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '0.4375rem 1rem', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'color 0.25s ease',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Bottom links */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/features" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '0.5rem' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Product Features
            </Link>
            <Link to="/contact" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Contact Support
            </Link>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main ref={contentRef} className="docs-main">
          {currentContent}

          {/* Section navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {(() => {
              const idx = ALL_IDS.indexOf(activeId)
              const prev = ALL_IDS[idx - 1]
              const next = ALL_IDS[idx + 1]
              const getLabel = id => NAV.flatMap(g => g.items).find(i => i.id === id)?.label || id
              return (
                <>
                  {prev ? (
                    <button onClick={() => scrollToSection(prev)} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.875rem 1.25rem', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>← Previous</span>
                      <span style={{ fontSize: '0.9375rem', color: '#fff', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{getLabel(prev)}</span>
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => scrollToSection(next)} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.875rem 1.25rem', cursor: 'pointer', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>Next →</span>
                      <span style={{ fontSize: '0.9375rem', color: '#fff', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{getLabel(next)}</span>
                    </button>
                  ) : <div />}
                </>
              )
            })()}
          </div>
        </main>

        {/* ── On-page ToC (right rail) ──────────────────────────────────────── */}
        <aside style={{ width: 200, flexShrink: 0, position: 'sticky', top: 'var(--nav-h)', height: 'calc(100vh - var(--nav-h))', overflowY: 'auto', padding: '2.5rem 1.25rem', display: 'flex', flexDirection: 'column' }} className="toc-rail">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem', fontFamily: 'var(--font-mono)' }}>
            On this page
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {h2s.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = document.getElementById(h.id)
                  if (el) {
                    const offset = 80
                    const top = el.getBoundingClientRect().top + window.scrollY - offset
                    window.scrollTo({ top, behavior: 'smooth' })
                  }
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
                  padding: '0.2rem 0', outline: 'none', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                {h.text}
              </button>
            ))}
            {h2s.length === 0 && (
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>No subsections</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
