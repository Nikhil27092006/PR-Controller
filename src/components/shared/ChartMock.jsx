import React from 'react'

/* ── Generic SVG Line / Area Chart ──── */
export function LineChart({ data = [], valueKey = 'value', labelKey = 'week', color = '#3b82f6', filled = true, height = 120 }) {
  if (!data.length) return null

  // Filter to numeric values for the y-axis range so a single
  // null/undefined entry doesn't poison min/max with NaN.
  const numericValues = data
    .map(d => d[valueKey])
    .filter(v => v !== null && v !== undefined && !Number.isNaN(v))

  if (!numericValues.length) {
    // No numeric data points at all — render an empty grid with
    // the week labels so the user can see the timeline shape
    // without a misleading flat line.
    const W = 480
    return (
      <div className="chart-wrap" aria-label="Line chart">
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
          <text x={W / 2} y={height / 2} fill="var(--text-40)" fontSize="12" textAnchor="middle">
            No data in this window
          </text>
        </svg>
        <div className="chart-labels-row">
          {data.map((d, i) => <span key={i} className="chart-label">{d[labelKey]}</span>)}
        </div>
      </div>
    )
  }

  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  const range = max - min || 1
  const W = 480; const H = height
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const v = d[valueKey]
    const hasValue = v !== null && v !== undefined && !Number.isNaN(v)
    // Render missing values at the chart floor (y = H - 8) but
    // mark them so we don't draw a connecting line through them
    // (which would falsely show "no activity" as 0 hours).
    const y = hasValue
      ? H - ((v - min) / range) * (H - 16) - 8
      : H - 8
    return { x, y, label: d[labelKey], value: v, hasValue }
  })

  // Build the polyline by skipping gaps between missing points
  // so the line doesn't connect across weeks that have no data.
  const segments = []
  let current = []
  for (const p of pts) {
    if (p.hasValue) {
      current.push(p)
    } else if (current.length) {
      segments.push(current)
      current = []
    }
  }
  if (current.length) segments.push(current)

  return (
    <div className="chart-wrap" aria-label="Line chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {filled && segments.map((seg, i) => {
          if (seg.length < 2) return null
          const areaPath = `M${seg[0].x},${H} ` + seg.map(p => `L${p.x},${p.y}`).join(' ') + ` L${seg[seg.length - 1].x},${H} Z`
          return <path key={i} d={areaPath} fill={`url(#lg-${color.replace('#','')})`} />
        })}
        {segments.map((seg, i) => {
          if (seg.length < 2) return null
          const polyline = seg.map(p => `${p.x},${p.y}`).join(' ')
          return (
            <polyline
              key={i}
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )
        })}
        {pts.map((p, i) => (
          p.hasValue
            ? <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.8" />
            : <circle key={i} cx={p.x} cy={H - 8} r="2" fill="var(--text-40)" opacity="0.35" />
        ))}
      </svg>
      <div className="chart-labels-row">
        {data.map((d, i) => <span key={i} className="chart-label">{d[labelKey]}</span>)}
      </div>
    </div>
  )
}

/* ── Bar Chart ──── */
export function BarChart({ data = [], aKey = 'created', bKey = 'closed', labelKey = 'week', aColor = '#3b82f6', bColor = '#22d3ee', height = 120 }) {
  if (!data.length) return null
  const allValues = data.flatMap(d => [d[aKey], d[bKey]])
  const max = Math.max(...allValues) || 1
  const BAR_W = 16; const GAP = 6

  return (
    <div className="chart-wrap" aria-label="Bar chart">
      <div className="bar-chart-inner" style={{ height, display: 'flex', alignItems: 'flex-end', gap: GAP }}>
        {data.map((d, i) => (
          <div key={i} className="bar-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            <div className="bar-segment" title={`${aKey}: ${d[aKey]}`} style={{ width: BAR_W, height: `${(d[aKey] / max) * height}px`, background: aColor, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
            <div className="bar-segment" title={`${bKey}: ${d[bKey]}`} style={{ width: BAR_W, height: `${(d[bKey] / max) * height}px`, background: bColor, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <div className="chart-labels-row" style={{ marginTop: '0.25rem' }}>
        {data.map((d, i) => <span key={i} className="chart-label">{d[labelKey]}</span>)}
      </div>
      <div className="chart-legend">
        <span><span className="legend-dot" style={{ background: aColor }} />{aKey}</span>
        <span><span className="legend-dot" style={{ background: bColor }} />{bKey}</span>
      </div>
    </div>
  )
}

/* ── Sparkline (mini inline) ──── */
export function Sparkline({ data = [], color = '#22d3ee', height = 32 }) {
  if (!data.length) return null
  const min = Math.min(...data); const max = Math.max(...data)
  const range = max - min || 1
  const W = 80
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: W, height }} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
