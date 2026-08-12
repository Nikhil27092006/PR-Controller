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
    label: 'Notifications',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'general',
    label: 'General',
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
        width: 42, height: 24, borderRadius: 12,
        background: checked ? 'var(--cyan-400)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? 'hsl(220 20% 8%)' : 'rgba(255,255,255,0.4)',
        transition: 'left 0.2s ease, background 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  )
}

function WeightSlider({ label, desc, value, onChange, totalWeight }) {
  const pct = Math.round((value / Math.max(totalWeight, 1)) * 100)
  return (
    <div style={{ padding: '1.25rem 1.375rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan-400)', lineHeight: 1 }}>{value}%</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>{pct}% of total</div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, cursor: 'pointer' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${value}%`, background: 'linear-gradient(90deg, rgba(59,130,246,0.7), var(--cyan-400))', borderRadius: 3, transition: 'width 0.1s' }} />
      </div>
      <input
        type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ width: '100%', marginTop: '-3px', opacity: 0, cursor: 'pointer', height: 12, position: 'relative', zIndex: 2 }}
        aria-label={label}
      />
    </div>
  )
}

function NotifRow({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.375rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
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
    showToast('Configuration settings updated successfully!', 'success')
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  const totalOk = totalWeight === 100

  return (
    <div className="app-page">
      <DashboardHeader
        title="System Settings"
        subtitle="Tune priority engines, sync profiles, and communication integrations."
      />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Tab Sidebar */}
          <nav style={{
            background: 'rgba(8,14,28,0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '0.625rem',
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
                    background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
                    color: active ? 'var(--cyan-400)' : 'rgba(255,255,255,0.45)',
                    fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400,
                    fontSize: '0.875rem', textAlign: 'left',
                    transition: 'all 0.15s ease',
                    outline: active ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Panel */}
          <form onSubmit={handleSave}>
            <div style={{ background: 'rgba(8,14,28,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {activeTab === 'engine' && (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)', marginBottom: '0.375rem' }}>
                      Priority Engine Weights
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      Configure how pull requests are scored. Adjust slider weights. &nbsp;
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, padding: '0.175rem 0.5rem', borderRadius: 5, background: totalOk ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', color: totalOk ? '#34d399' : '#fbbf24' }}>
                        Total: {totalWeight}% {totalOk ? '✓' : '— target 100%'}
                      </span>
                    </p>
                  </div>
                  <WeightSlider label="Dependency Network Depth" desc="Prioritizes PRs that block downstream dependency chains or releases." value={weights.dependencyDepth} onChange={v => handleWeightChange('dependencyDepth', v)} totalWeight={totalWeight} />
                  <WeightSlider label="Reviewer Workload Balance" desc="Adjusts routing priority based on the review queues of assigned code reviewers." value={weights.reviewerLoad} onChange={v => handleWeightChange('reviewerLoad', v)} totalWeight={totalWeight} />
                  <WeightSlider label="PR Size (Diff Size Weight)" desc="Gives a boost to smaller, quicker-to-review PRs to reduce WIP queue buildup." value={weights.linesChanged} onChange={v => handleWeightChange('linesChanged', v)} totalWeight={totalWeight} />
                  <WeightSlider label="CI / CD Run Status" desc="Deprioritizes pull requests with broken, missing, or long-running builds." value={weights.ciStatus} onChange={v => handleWeightChange('ciStatus', v)} totalWeight={totalWeight} />
                  <WeightSlider label="Pull Request Age Decay" desc="Gradually raises the priority score of older PRs to prevent reviewer abandonment." value={weights.prAge} onChange={v => handleWeightChange('prAge', v)} totalWeight={totalWeight} />
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)', marginBottom: '0.375rem' }}>
                      Notification Channels
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      Manage how PRFlow alerts developers about bottlenecks, review requests, and CI blockers.
                    </p>
                  </div>
                  <NotifRow label="Daily Digest Email" desc="Send an overview of pending critical PRs every morning at 9am." checked={notifications.emailSummary} onChange={v => setNotifications(p => ({ ...p, emailSummary: v }))} />
                  <NotifRow label="Reviewer Overload Warnings" desc="Alert when a developer is assigned more than 4 concurrent open PRs." checked={notifications.reviewerTriggers} onChange={v => setNotifications(p => ({ ...p, reviewerTriggers: v }))} />
                  <NotifRow label="Dependency Blocker Alerts" desc="Notify teams immediately when a high-priority PR becomes blocked." checked={notifications.blockerTriggers} onChange={v => setNotifications(p => ({ ...p, blockerTriggers: v }))} />

                  {/* Slack toggle + conditional webhook input */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.375rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem' }}>Slack Webhook Alerts</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Pipe urgent bottleneck events directly to engineering Slack channels.</div>
                      </div>
                      <Toggle checked={notifications.slackAlerts} onChange={v => setNotifications(p => ({ ...p, slackAlerts: v }))} />
                    </div>
                    {notifications.slackAlerts && (
                      <div style={{ padding: '0 1.375rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', marginTop: '0.875rem' }}>
                          Slack Incoming Webhook URL
                        </label>
                        <input
                          type="text"
                          value={notifications.slackWebhook}
                          onChange={e => setNotifications(p => ({ ...p, slackWebhook: e.target.value }))}
                          className="form-input"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'general' && (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)', marginBottom: '0.375rem' }}>
                      General Platform Settings
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      Configure synchronization intervals and workspace appearance preferences.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 1.375rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem' }}>Automated Background Sync</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Run continuous sync of pull request metadata via GitHub Webhooks.</div>
                      </div>
                      <Toggle checked={general.autoSync} onChange={v => setGeneral(p => ({ ...p, autoSync: v }))} />
                    </div>
                    {general.autoSync && (
                      <div style={{ padding: '0 1.375rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', marginTop: '0.875rem' }}>
                          Sync Interval
                        </label>
                        <select
                          value={general.syncInterval}
                          onChange={e => setGeneral(p => ({ ...p, syncInterval: e.target.value }))}
                          className="form-input"
                          style={{ width: 'auto', minWidth: 220 }}
                        >
                          <option value="5">Every 5 minutes — Real-time</option>
                          <option value="15">Every 15 minutes — Balanced</option>
                          <option value="30">Every 30 minutes</option>
                          <option value="60">Hourly</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1.125rem 1.375rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.625rem' }}>Workspace Theme</div>
                    <select
                      value={general.theme}
                      onChange={e => setGeneral(p => ({ ...p, theme: e.target.value }))}
                      className="form-input"
                      style={{ width: 'auto', minWidth: 240 }}
                    >
                      <option value="dark">Deep Space — Premium Dark Mode</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </>
              )}

              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
