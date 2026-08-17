import React from 'react'

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  subtitle,
  icon,
  sparklineData,
  loading = false,
  color = '#3b82f6',
  onClick
}) {
  const deltaClass = trendDirection === 'up'
    ? 'stat-delta-up'
    : trendDirection === 'down'
      ? 'stat-delta-down'
      : 'stat-delta-neutral'

  // Generate smooth SVG sparkline path
  const renderSparkline = () => {
    const points = sparklineData || [12, 18, 15, 25, 22, 30, 28, 38]
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const width = 72
    const height = 26
    const step = width / (points.length - 1)

    const coords = points.map((p, i) => {
      const x = i * step
      const y = height - ((p - min) / range) * (height - 6) - 3
      return `${x},${y}`
    })

    const pathD = `M ${coords.join(' L ')}`
    const areaD = `M ${coords.join(' L ')} L ${width},${height} L 0,${height} Z`

    return (
      <svg className="stat-sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <div
      className="stat-card glass"
      style={{
        borderColor: `${color}28`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {loading ? (
        <div className="stat-card-skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-value" />
          <div className="skeleton-meta" />
        </div>
      ) : (
        <>
          <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
            <h3 className="stat-card-title">{title}</h3>
            {icon && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color,
                  fontSize: '0.85rem'
                }}
              >
                {icon}
              </div>
            )}
          </div>

          <div className="stat-card-spark-wrap">
            <div>
              <div className="stat-card-value" style={{ color: '#fff' }}>{value}</div>
              {trend && (
                <div className={`stat-delta-chip ${deltaClass}`}>
                  {trendDirection === 'up' ? '▲' : trendDirection === 'down' ? '▼' : '●'} {trend}
                </div>
              )}
            </div>
            {renderSparkline()}
          </div>

          {subtitle && (
            <p className="stat-card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{subtitle}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}

