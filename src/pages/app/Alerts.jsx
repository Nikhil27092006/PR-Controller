
import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

const TYPE_CONFIGS = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.2)',
    label: 'Critical',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  },
  warning: {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.2)',
    label: 'Warning',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  info: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.2)',
    label: 'Info',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    )
  },
  error: {
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.08)',
    border: 'rgba(248, 113, 113, 0.2)',
    label: 'Error',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }
}

export default function Alerts() {
  const { alerts, markAlertRead, clearAllAlerts } = useApp()
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.read) return false
    if (filter === 'read' && !alert.read) return false
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false
    return true
  })

  return (
    <div className="app-page">
      <DashboardHeader
        title="System Alerts"
        subtitle="Real-time notifications, workload triggers, and dependency blocks."
      />

      <div className="page-content">
        {/* Controls Bar */}
        <div className="glass" style={{ borderRadius: 'var(--radius-md)', padding: '1rem 1.375rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Read / Unread tab group */}
            <div className="alerts-tab-group">
              {[
                { key: 'all', label: `All (${alerts.length})` },
                { key: 'unread', label: `Unread (${alerts.filter(a => !a.read).length})` },
                { key: 'read', label: `Read (${alerts.filter(a => a.read).length})` },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`alerts-tab ${filter === t.key ? 'active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Severity filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="alerts-severity-select"
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>

          {alerts.some(a => !a.read) && (
            <button
              onClick={clearAllAlerts}
              className="btn btn-ghost"
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.25)', fontSize: '0.75rem' }}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAlerts.length === 0 ? (
            <div className="glass" style={{ borderRadius: 'var(--radius-md)' }}>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-40)" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="empty-state-title">No alerts found</div>
                <p className="empty-state-desc">
                  There are no alerts matching the active filters. Everything in the workflow is running smoothly.
                </p>
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = TYPE_CONFIGS[alert.type] || TYPE_CONFIGS.info
              return (
                <div
                  key={alert.id}
                  className="glass"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1rem 1.375rem',
                    opacity: alert.read ? 0.6 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', flex: 1 }}>
                    {/* Icon */}
                    <div style={{
                      padding: '0.4375rem',
                      borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', padding: '0.2rem 0.5rem',
                          borderRadius: 4, background: cfg.bg, color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)' }}>{alert.age}</span>
                        {!alert.read && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--cyan-400)',
                            boxShadow: '0 0 6px var(--cyan-400)',
                            display: 'inline-block',
                            animation: 'pulse 2.2s ease-in-out infinite',
                          }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-80)', lineHeight: 1.55, margin: 0 }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {!alert.read && (
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', flexShrink: 0, alignSelf: 'center' }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
