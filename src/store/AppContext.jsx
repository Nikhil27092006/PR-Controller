import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(undefined)

const INITIAL_REPOS = [
  { id: 1, owner: 'facebook', name: 'react', connected: true, status: 'synced', lastSync: '10 min ago', prCount: 18, color: '#61dafb' },
  { id: 2, owner: 'vercel', name: 'next.js', connected: true, status: 'synced', lastSync: '2 hrs ago', prCount: 34, color: '#000000' },
  { id: 3, owner: 'tailwindlabs', name: 'tailwindcss', connected: false, status: 'disconnected', lastSync: 'Never', prCount: 0, color: '#38bdf8' },
  { id: 4, owner: 'fastapi', name: 'fastapi', connected: true, status: 'syncing', lastSync: 'Syncing now...', prCount: 5, color: '#059669' },
]

const INITIAL_ALERTS = [
  { id: 1, type: 'critical', message: 'Reviewer Overload: Alex Chen has 5 open critical reviews.', age: '5m ago', read: false },
  { id: 2, type: 'warning', message: 'Dependency Block: PR #4521 is blocking 3 down-stream deploys.', age: '15m ago', read: false },
  { id: 3, type: 'info', message: 'Sync complete for Vercel Next.js repository.', age: '2h ago', read: true },
  { id: 4, type: 'error', message: 'Sync failed: GitHub API rate limits exceeded on tailwindcss.', age: '1d ago', read: true }
]

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check if user session exists in storage
    const saved = localStorage.getItem('prflow_user')
    return saved ? JSON.parse(saved) : null
  })
  
  const [repos, setRepos] = useState(INITIAL_REPOS)
  const [selectedRepoId, setSelectedRepoId] = useState('all')
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [toasts, setToasts] = useState([])

  // Toast dispatch helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Login handler
  const login = useCallback((email, password) => {
    if (!email || !password) return false
    const mockUser = {
      id: 'usr_1',
      name: 'Sarah Dev',
      email,
      avatar: 'SD',
      role: 'Engineering Lead'
    }
    setUser(mockUser)
    localStorage.setItem('prflow_user', JSON.stringify(mockUser))
    showToast('Successfully authenticated!', 'success')
    return true
  }, [showToast])

  // Logout handler
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('prflow_user')
    showToast('Logged out successfully.', 'info')
  }, [showToast])

  // Connect Repository
  const connectRepo = useCallback((id) => {
    setRepos((prev) =>
      prev.map((repo) => {
        if (repo.id === id) {
          showToast(`Connecting ${repo.owner}/${repo.name}...`, 'info')
          return { ...repo, connected: true, status: 'syncing', lastSync: 'Syncing...' }
        }
        return repo
      })
    )
    
    // Simulate sync completion
    setTimeout(() => {
      setRepos((prev) =>
        prev.map((repo) => {
          if (repo.id === id) {
            showToast(`Synchronized repository ${repo.owner}/${repo.name}`, 'success')
            // Add a mock sync alert
            setAlerts(prevAlerts => [
              {
                id: Date.now(),
                type: 'info',
                message: `Connection sync complete for ${repo.owner}/${repo.name}`,
                age: 'Just now',
                read: false
              },
              ...prevAlerts
            ])
            return { ...repo, status: 'synced', lastSync: 'Just now', prCount: Math.floor(Math.random() * 20) + 5 }
          }
          return repo
        })
      )
    }, 3000)
  }, [showToast])

  // Disconnect Repository
  const disconnectRepo = useCallback((id) => {
    setRepos((prev) =>
      prev.map((repo) => {
        if (repo.id === id) {
          showToast(`Disconnected ${repo.owner}/${repo.name}`, 'warning')
          return { ...repo, connected: false, status: 'disconnected', lastSync: 'Never', prCount: 0 }
        }
        return repo
      })
    )
  }, [showToast])

  // Mark alerts as read
  const markAlertRead = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert))
    )
  }, [])

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([])
    showToast('Cleared all system notifications.', 'info')
  }, [showToast])

  return (
    <AppContext.Provider
      value={{
        user,
        repos,
        alerts,
        toasts,
        selectedRepoId,
        setSelectedRepoId,
        login,
        logout,
        connectRepo,
        disconnectRepo,
        markAlertRead,
        clearAllAlerts,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
