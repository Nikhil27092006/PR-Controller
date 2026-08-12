import React from 'react'

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  subtitle,
  icon,
  loading = false,
  color = '#2563eb'
}) {
  const trendColorClass = trendDirection === 'up' 
    ? 'trend-up' 
    : trendDirection === 'down' 
      ? 'trend-down' 
      : 'trend-neutral'

  return (
    <div className="stat-card glass" style={{ borderColor: `${color}1e` }}>
      {loading ? (
        <div className="stat-card-skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-value" />
          <div className="skeleton-meta" />
        </div>
      ) : (
        <>
          <div className="stat-card-header">
            <h3 className="stat-card-title">{title}</h3>
            {icon && <span className="stat-card-icon" style={{ color }}>{icon}</span>}
          </div>
          
          <div className="stat-card-value-row">
            <div className="stat-card-value">{value}</div>
            {trend && (
              <div className={`stat-card-trend ${trendColorClass}`}>
                {trendDirection === 'up' ? '▲' : trendDirection === 'down' ? '▼' : '●'} {trend}
              </div>
            )}
          </div>
          
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </>
      )}
    </div>
  )
}
