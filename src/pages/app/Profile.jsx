import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

const AUDIT_LOGS = [
  { id: 1, action: 'Updated Priority Weights', resource: 'Triage Engine', date: 'Just now', ip: '192.168.1.45', type: 'config' },
  { id: 2, action: 'Synchronized Org Repository', resource: 'facebook/react', date: '10 mins ago', ip: '192.168.1.45', type: 'sync' },
  { id: 3, action: 'GitHub OAuth Verification', resource: 'OAuth 2.0 Provider', date: '1 hour ago', ip: '192.168.1.45', type: 'auth' },
  { id: 4, action: 'Linked Organization Scope', resource: 'PRFlow Enterprise', date: '2 days ago', ip: '192.168.1.2', type: 'admin' },
]

export default function Profile() {
  const { user, showToast } = useApp()
  const [profile, setProfile] = useState({
    name: user?.username || 'Sarah Dev',
    email: user?.email || 'sarah@developer.io',
    role: 'Lead Platform Architect',
    githubUsername: user?.username || 'sarahdev-code',
  })

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    showToast('Developer profile credentials saved.', 'success')
  }

  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    if (!pw.current || !pw.newPw || !pw.confirm) {
      showToast('All password fields are required.', 'error')
      return
    }
    if (pw.newPw !== pw.confirm) {
      showToast('Passwords do not match.', 'error')
      return
    }
    showToast('Security credentials updated.', 'success')
    setPw({ current: '', newPw: '', confirm: '' })
  }

  return (
    <div className="app-page">
      <DashboardHeader
        title="Developer Passport"
        subtitle="Manage personal GitHub identity, OAuth scopes, and security audit logs"
      />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT: Holographic Developer Passport & Audit ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Passport Card */}
            <div className="glass" style={{ borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center', borderColor: 'rgba(34,211,238,0.3)', background: 'linear-gradient(135deg, rgba(8,14,28,0.9) 0%, rgba(13,23,46,0.85) 100%)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #3b82f6, var(--cyan-400), #a855f7)' }} />

              <div className="reviewer-avatar" style={{ width: 64, height: 64, fontSize: '1.35rem', fontWeight: 800, margin: '0 auto 1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)', color: '#040810', border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 0 25px rgba(34,211,238,0.35)' }}>
                {(user?.username || 'PR').slice(0, 2).toUpperCase()}
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                {profile.name}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--cyan-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                {profile.role}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
                {profile.email}
              </div>

              {/* Passport Metadata */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>GitHub Linked</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>@{profile.githubUsername}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Auth Method</span>
                  <span className="tag tag-blue" style={{ fontSize: '0.625rem' }}>OAuth 2.0 Verified</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Plan Tier</span>
                  <span className="pro-tier-pill" style={{ padding: '0.15rem 0.5rem', fontSize: '0.625rem' }}>PRO SUITE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Account Status</span>
                  <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                    Active Session
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="glass dashboard-section">
              <div className="section-header">
                <h3 className="section-title">Security Audit Log</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {AUDIT_LOGS.map((log, i) => (
                  <div key={log.id} style={{ padding: '0.5rem 0', borderBottom: i < AUDIT_LOGS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{log.action}</span>
                      <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>{log.date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                      <span>{log.resource}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{log.ip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT: Forms & Settings ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Profile Information Form */}
            <div className="glass dashboard-section">
              <div className="section-header">
                <h3 className="section-title">Identity & Role Credentials</h3>
              </div>

              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Primary Role</label>
                    <input
                      type="text"
                      value={profile.role}
                      onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Registered Contact Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Linked GitHub Username</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={profile.githubUsername}
                      onChange={e => setProfile(p => ({ ...p, githubUsername: e.target.value }))}
                      className="form-input"
                      style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                    />
                    <button type="button" onClick={() => showToast('Re-authenticated GitHub OAuth handshake', 'success')} className="btn btn-ghost" style={{ flexShrink: 0, fontSize: '0.75rem' }}>
                      Re-Verify OAuth
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Security Passwords Form */}
            <div className="glass dashboard-section">
              <div className="section-header">
                <h3 className="section-title">Security & Session Password</h3>
              </div>

              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                    className="form-input"
                    placeholder="Enter current password"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={pw.newPw}
                      onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                      className="form-input"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={pw.confirm}
                      onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                      className="form-input"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Update Security Password
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

