import React, { useEffect, useState } from 'react'
import { useApp } from '../../store/AppContext'

const ICONS = {
  success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  error:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
}

function ToastItem({ toast }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])
  const colorMap = { success: '#34d399', error: '#f87171', warning: '#fbbf24', info: '#60a5fa' }
  const color = colorMap[toast.type] || colorMap.info
  return (
    <div className={`toast-item glass-md ${visible ? 'toast-visible' : ''}`} style={{ borderLeftColor: color }} role="alert" aria-live="polite">
      <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
      <span className="toast-message">{toast.message}</span>
    </div>
  )
}

export default function Toast() {
  const { toasts } = useApp()
  return (
    <div className="toast-container" aria-label="Notifications" role="region">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
