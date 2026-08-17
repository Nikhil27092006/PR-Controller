import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

const TABS = [
  {
    id: 'engine',
    label: 'Priority Engine',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notification Feeds',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'general',
    label: 'Pipeline & Sync',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
      </svg>
    ),
  },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--cyan-400)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        boxShadow: checked ? '0 0 12px rgba(34,211,238,0.4)' : 'none'
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? '#040810' : '#fff',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
      }} />
    </button>
  )
}

function WeightSlider({ label, desc, value, onChange, totalWeight }) {
  const pct = Math.round((value / Math.max(totalWeight, 1)) * 100)
  return (
    <div style={{ padding: '1.125rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: '0.15rem' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan-400)', lineHeight: 1 }}>{value}%</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>{pct}% relative</div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${value}%`, background: 'linear-gradient(90deg, #3b82f6, var(--cyan-400))', borderRadius: 3, boxShadow: '0 0 10px rgba(34,211,238,0.4)' }} />
      </div>
      <input
        type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ width: '100%', marginTop: '-4px', opacity: 0, cursor: 'pointer', height: 14, position: 'relative', zIndex: 2 }}
        aria-label={label}
      />
    </div>
  )
}

function NotifRow({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: '0.15rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function Settings() {
  const { showToast } = useApp()
  const [activeTab, setActiveTab] = useState('engine')

  const [weights, setWeights] = useState({
    dependencyDepth: 35,
    reviewerLoad: 25,
    linesChanged: 15,
    ciStatus: 15,
    prAge: 10,
  })

  const [notifications, setNotifications] = useState({
    emailSummary: true,
    slackAlerts: false,
    slackWebhook: 'https://hooks.slack.com/services/...',
    reviewerTriggers: true,
    blockerTriggers: true,
  })

  const [general, setGeneral] = useState({
    autoSync: true,
    syncInterval: '15',
    theme: 'dark',
  })

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: Math.min(100, Math.max(0, val)) }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    showToast('Platform telemetry settings updated successfully!', 'success')
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const totalOk = totalWeight === 100

  return (
    <div className="app-page">
      <DashboardHeader
        title="Platform Settings"
        subtitle="Calibrate priority heuristics, telemetry pipelines, and automated alerts"
      />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* Tab Navigation Sidebar */}
          <nav className="glass" style={{
            borderRadius: 12,
            padding: '0.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
                    color: active ? 'var(--cyan-400)' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-sans)', fontWeight: active ? 700 : 500,
                    fontSize: '0.8125rem', textAlign: 'left',
                    transition: 'all 0.15s ease',
                    outline: active ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Active Settings Panel */}
          <form onSubmit={handleSave}>
            <div className="glass dashboard-section" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {activeTab === 'engine' && (
                <>
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">Priority Triage Engine Weights</h3>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                        Fine-tune heuristic coefficients that determine automated PR urgency rankings.
                      </p>
                    </div>
                    <span className="glow-pill" style={{ background: totalOk ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: totalOk ? '#34d399' : '#fbbf24', border: `1px solid ${totalOk ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                      Sum: {totalWeight}% {totalOk ? '✓ Target Met' : '⚠️ Must sum to 100%'}
                    </span>
                  </div>

                  <WeightSlider label="Dependency Depth & Blocker Impact" desc="Weights pull requests that unblock other engineers or downstream production releases." value={weights.dependencyDepth} onChange={v => handleWeightChange('dependencyDepth', v)} totalWeight={totalWeight} />
                  <WeightSlider label="Reviewer Workload Capacity" desc="Prioritizes PRs for engineers with open review bandwidth to prevent queuing." value={weights.reviewerLoad} onChange={v => handleWeightChange('reviewerLoad', v)} totalWeight={totalWeight} />
                  <WeightSlider label="Diff Size & Complexity Footprint" desc="Boosts small, compact pull requests to maximize continuous integration velocity." value={weights.linesChanged} onChange={v => handleWeightChange('linesChanged', v)} totalWeight={totalWeight} />
                  <WeightSlider label="CI/CD Build Health Status" desc="Deprioritizes pull requests with failed unit tests or linting errors." value={weights.ciStatus} onChange={v => handleWeightChange('ciStatus', v)} totalWeight={totalWeight} />
                  <WeightSlider label="Aging & SLA Stale Penalty" desc="Elevates older pull requests to prevent abandonment and technical stagnation." value={weights.prAge} onChange={v => handleWeightChange('prAge', v)} totalWeight={totalWeight} />
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">Automated Notification Feeds</h3>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                        Configure alerts for blocker incidents, reviewer capacity spikes, and daily digests.
                      </p>
                    </div>
                  </div>

                  <NotifRow label="Executive Daily Digest" desc="Sends an overview of pending critical PRs and SLA risks every morning at 09:00 UTC." checked={notifications.emailSummary} onChange={v => setNotifications(p => ({ ...p, emailSummary: v }))} />
                  <NotifRow label="Reviewer Overload Warnings" desc="Alerts team leads when an engineer exceeds their max capacity ceiling." checked={notifications.reviewerTriggers} onChange={v => setNotifications(p => ({ ...p, reviewerTriggers: v }))} />
                  <NotifRow label="Critical Path Blocker Alerts" desc="Immediate high-priority notification when a critical release PR is blocked." checked={notifications.blockerTriggers} onChange={v => setNotifications(p => ({ ...p, blockerTriggers: v }))} />

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.25rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: '0.15rem' }}>Slack & Discord Webhook Alerts</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Pipe urgent bottleneck telemetry directly into engineering Slack channels.</div>
                      </div>
                      <Toggle checked={notifications.slackAlerts} onChange={v => setNotifications(p => ({ ...p, slackAlerts: v }))} />
                    </div>
                    {notifications.slackAlerts && (
                      <div style={{ padding: '0 1.25rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <label className="form-label" style={{ marginTop: '0.75rem' }}>
                          Incoming Webhook Endpoint URL
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={notifications.slackWebhook}
                            onChange={e => setNotifications(p => ({ ...p, slackWebhook: e.target.value }))}
                            className="form-input"
                            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                            placeholder="https://hooks.slack.com/services/..."
                          />
                          <button type="button" onClick={() => showToast('Dispatched test payload to Slack webhook', 'success')} className="btn btn-ghost" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                            Send Test Ping
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'general' && (
                <>
                  <div className="section-header">
                    <div>
                      <h3 className="section-title">Pipeline & Sync Settings</h3>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                        Configure webhook ingestion intervals and visual appearance preferences.
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.25rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: '0.15rem' }}>Continuous Background Polling</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Synchronizes pull request states in real-time alongside GitHub Webhooks.</div>
                      </div>
                      <Toggle checked={general.autoSync} onChange={v => setGeneral(p => ({ ...p, autoSync: v }))} />
                    </div>
                    {general.autoSync && (
                      <div style={{ padding: '0 1.25rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <label className="form-label" style={{ marginTop: '0.75rem' }}>
                          Telemetry Polling Frequency
                        </label>
                        <select
                          value={general.syncInterval}
                          onChange={e => setGeneral(p => ({ ...p, syncInterval: e.target.value }))}
                          className="form-input"
                          style={{ width: 'auto', minWidth: 260 }}
                        >
                          <option value="5">Every 5 minutes — Real-time stream</option>
                          <option value="15">Every 15 minutes — High Performance</option>
                          <option value="30">Every 30 minutes</option>
                          <option value="60">Hourly batch sync</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1.125rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', marginBottom: '0.5rem' }}>Dashboard Visual Theme</div>
                    <select
                      value={general.theme}
                      onChange={e => setGeneral(p => ({ ...p, theme: e.target.value }))}
                      className="form-input"
                      style={{ width: 'auto', minWidth: 260 }}
                    >
                      <option value="dark">Executive Deep Dark Glass (Active)</option>
                      <option value="system">Follow System Appearance</option>
                    </select>
                  </div>
                </>
              )}

              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

