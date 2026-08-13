import React, { useState } from 'react'
import DashboardHeader from '../../components/shared/DashboardHeader'
import { useApp } from '../../store/AppContext'

const AUDIT_LOGS = [
  { id: 1, action: 'Updated Priority Weights', resource: 'Workspace Settings', date: 'Just now', ip: '192.168.1.45' },
  { id: 2, action: 'Synchronized Org Repository', resource: 'facebook/react', date: '10 mins ago', ip: '192.168.1.45' },
  { id: 3, action: 'Successful Authentication', resource: 'Login Portal', date: '1 hour ago', ip: '192.168.1.45' },
  { id: 4, action: 'Connected GitHub Organization', resource: 'SarahDev-Org', date: '2 days ago', ip: '192.168.1.2' },
]

export default function Profile() {
  const { user, showToast } = useApp()
  const [profile, setProfile] = useState({
    name: user?.username || '',
    email: user?.email || '',
    role: '',
    githubUsername: 'sarahdev-code',
    receiveActivityAlerts: true,
  })

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    showToast('Profile credentials saved.', 'success')
  }

  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    if (!pw.current || !pw.newPw || !pw.confirm) {
      showToast('All password fields are required.', 'error'); return
    }
    if (pw.newPw !== pw.confirm) {
      showToast('Passwords do not match.', 'error'); return
    }
    showToast('Your security credentials have been updated.', 'success')
    setPw({ current: '', newPw: '', confirm: '' })
  }

  const cardStyle = {
    borderRadius: 'var(--radius-md)',
    padding: '1.75rem',
    background: 'rgba(8,14,28,0.6)',
    border: '1px solid var(--border-8)',
    backdropFilter: 'blur(24px)',
  }

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-40)',
    marginBottom: '0.5rem',
    display: 'block',
  }

  return (
    <div className="app-page">
      <DashboardHeader
        title="Developer Profile"
        subtitle="Manage your personal credentials, identity links, and workspace logs."
      />

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — Profile card + Audit log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Profile Card */}
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem 1.75rem' }}>
              <div className="profile-avatar-ring" style={{ margin: '0 auto 1.25rem' }}>
                {(user?.username || '??').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)', marginBottom: '0.2rem' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--cyan-400)', fontWeight: 600, marginBottom: '0.25rem' }}>
                {profile.role}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-40)', marginBottom: '1.5rem' }}>
                {profile.email}
              </div>

              {/* Meta rows */}
              <div style={{ borderTop: '1px solid var(--border-4)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
                    label: 'Linked Identity',
                    value: (
                      <span style={{ fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                        @{profile.githubUsername}
                      </span>
                    )
                  },
                  { label: 'Access Level', value: <strong>Org Administrator</strong> },
                  {
                    label: 'Status',
                    value: (
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        Active
                      </span>
                    )
                  },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-40)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-80)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-40)" strokeWidth="2">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)' }}>
                  Audit Log
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {AUDIT_LOGS.map((log, i) => (
                  <div key={log.id} style={{ padding: '0.625rem 0', borderBottom: i < AUDIT_LOGS.length - 1 ? '1px solid var(--border-4)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-80)' }}>{log.action}</span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '0.5rem' }}>{log.date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-40)', fontFamily: 'var(--font-mono)' }}>
                      <span>{log.resource}</span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Account Credentials */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)', marginBottom: '1.5rem' }}>
                Account Credentials
              </h2>
              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label style={labelStyle}>Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label style={labelStyle}>System Role</label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="form-input"
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label style={labelStyle}>Registered Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label style={labelStyle}>GitHub Account Connection</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={profile.githubUsername}
                      onChange={e => setProfile(p => ({ ...p, githubUsername: e.target.value }))}
                      className="form-input"
                      style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                    />
                    <button type="button" className="btn btn-ghost" style={{ flexShrink: 0 }}>
                      Re-Auth
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Save Profile Settings
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)', marginBottom: '1.5rem' }}>
                Security Credentials
              </h2>
              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field">
                  <label style={labelStyle}>Current Password</label>
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
                    <label style={labelStyle}>New Password</label>
                    <input
                      type="password"
                      value={pw.newPw}
                      onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                      className="form-input"
                      placeholder="New password"
                    />
                  </div>
                  <div className="form-field">
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password"
                      value={pw.confirm}
                      onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                      className="form-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    Update Password
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
