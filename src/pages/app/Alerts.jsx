import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardHeader from '../../components/shared/DashboardHeader'
import {
  FireIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ZapIcon,
  ActivityIcon
} from '../../components/shared/Icons'
import { useApp } from '../../store/AppContext'

const TYPE_CONFIGS = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.35)',
    label: 'Critical Incident',
    icon: <FireIcon size={16} color="#ef4444" />
  },
  warning: {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.35)',
    label: 'Warning',
    icon: <AlertTriangleIcon size={16} color="#fbbf24" />
  },
  info: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.35)',
    label: 'Notification',
    icon: <ActivityIcon size={16} color="#3b82f6" />
  },
  error: {
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
    border: 'rgba(248, 113, 113, 0.35)',
    label: 'Pipeline Error',
    icon: <ZapIcon size={16} color="#f87171" />
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
        subtitle={`${alerts.length} total events tracked • ${unreadCount} unread • ${criticalCount} critical`}
      />

      <div className="page-content">

        {/* ── Top Metric Cards ─── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
          {[
            { label: 'Unread Alerts', value: unreadCount, color: unreadCount > 0 ? '#fbbf24' : '#34d399', sub: 'Requiring review attention' },
            { label: 'Critical Incidents', value: criticalCount, color: criticalCount > 0 ? '#f87171' : '#34d399', sub: 'High-severity pipeline blocks' },
            { label: 'Total Historical', value: alerts.length, color: '#60a5fa', sub: 'Logged across all workspaces' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass" style={{ borderRadius: 12, padding: '1.125rem 1.25rem', borderColor: `${s.color}25` }}>
              <h3 className="stat-card-title">{s.label}</h3>
              <div className="stat-card-value" style={{ color: s.color, marginTop: '0.35rem' }}>{s.value}</div>
              <p className="stat-card-subtitle">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Controls Bar ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn btn-ghost ${filter === f ? 'active' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  background: filter === f ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: filter === f ? 'var(--cyan-400)' : 'rgba(255,255,255,0.6)',
                  borderColor: filter === f ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)',
                  textTransform: 'capitalize'
                }}
              >
                {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            ))}

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 30, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircleIcon size={44} color="#34d399" />
              </div>
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
                        {!alert.read && (
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--cyan-400)',
                            display: 'inline-block'
                          }} />
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                          {alert.time}
                        </span>
                      </div>

                      <h4 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {alert.title}
                      </h4>

                      <p style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.5,
                        margin: 0
                      }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {alert.action && (
                      <Link
                        to={alert.action}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: 'var(--cyan-400)', borderColor: 'rgba(56,189,248,0.3)' }}
                      >
                        Inspect →
                      </Link>
                    )}

                    {!alert.read && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', color: 'rgba(255,255,255,0.4)' }}
                        title="Mark as read"
                      >
                        Dismiss
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
