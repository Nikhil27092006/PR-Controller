import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

const TYPE_CONFIGS = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.35)',
    label: 'Critical Incident',
    icon: '🔥'
  },
  warning: {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.35)',
    label: 'Warning',
    icon: '⚠️'
  },
  info: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.35)',
    label: 'Notification',
    icon: 'ℹ️'
  },
  error: {
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
    border: 'rgba(248, 113, 113, 0.35)',
    label: 'Pipeline Error',
    icon: '⚡'
  }
}

export default function Alerts() {
  const { alerts, markAlertRead, clearAllAlerts, showToast } = useApp()
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const unreadCount = useMemo(() => alerts.filter(a => !a.read).length, [alerts])
  const criticalCount = useMemo(() => alerts.filter(a => a.type === 'critical' || a.type === 'error').length, [alerts])

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.read) return false
    if (filter === 'read' && !alert.read) return false
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false
    return true
  })

  const handleClearAll = () => {
    clearAllAlerts()
    showToast('All alerts marked as read', 'info')
  }

  return (
    <div className="app-page">
      <DashboardHeader
        title="Incident & Alert Feed"
        subtitle="Real-time telemetry triggers, reviewer overload warnings, and blocker alerts"
      />

      <div className="page-content">

        {/* ── Top Summary Telemetry ─── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: unreadCount > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)' }}>
            <h3 className="stat-card-title">Unacknowledged Alerts</h3>
            <div className="stat-card-value" style={{ color: '#60a5fa', marginTop: '0.35rem' }}>{unreadCount}</div>
            <p className="stat-card-subtitle">{unreadCount > 0 ? 'Action required' : 'All clear'}</p>
          </div>

          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: criticalCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}>
            <h3 className="stat-card-title">Critical PR Bottlenecks</h3>
            <div className="stat-card-value" style={{ color: '#f87171', marginTop: '0.35rem' }}>{criticalCount}</div>
            <p className="stat-card-subtitle">{criticalCount > 0 ? 'Impacts downstream releases' : 'No release blockers'}</p>
          </div>

          <div className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: 'rgba(52,211,153,0.3)' }}>
            <h3 className="stat-card-title">Live Triage Watchdog</h3>
            <div className="stat-card-value" style={{ color: '#34d399', marginTop: '0.35rem' }}>Active</div>
            <p className="stat-card-subtitle">Automated rule evaluation</p>
          </div>
        </div>

        {/* ── Controls Bar ─── */}
        <div className="glass" style={{ borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {[
                { key: 'all', label: `All (${alerts.length})` },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'read', label: `Read (${alerts.length - unreadCount})` },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`btn btn-ghost ${filter === t.key ? 'btn-ghost-active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    ...(filter === t.key ? { background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', color: 'var(--blue-300)' } : {})
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: 32 }}
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-ghost"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* ── Alerts Feed ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAlerts.length === 0 ? (
            <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#34d399' }}>✓</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', color: '#fff', fontWeight: 700, marginBottom: '0.35rem' }}>
                All Systems Operational
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto' }}>
                No active incident alerts matching the selected filters. All pull request pipelines are flowing smoothly.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = TYPE_CONFIGS[alert.type] || TYPE_CONFIGS.info
              return (
                <div
                  key={alert.id}
                  className="glass alert-feed-item"
                  style={{
                    borderRadius: 12,
                    borderLeft: `4px solid ${cfg.color}`,
                    background: `linear-gradient(90deg, ${cfg.bg} 0%, rgba(8,14,28,0.7) 100%)`,
                    borderColor: cfg.border,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.125rem 1.35rem',
                    opacity: alert.read ? 0.65 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {cfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                          {alert.age || 'Just now'}
                        </span>
                        {!alert.read && (
                          <span className="live-pulse-dot" style={{ width: 7, height: 7, marginLeft: '0.25rem' }} />
                        )}
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#fff', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <Link to="/prs" className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                      Inspect PR →
                    </Link>
                    {!alert.read && (
                      <button
                        onClick={() => {
                          markAlertRead(alert.id)
                          showToast('Alert acknowledged', 'info')
                        }}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: 'var(--cyan-400)' }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
