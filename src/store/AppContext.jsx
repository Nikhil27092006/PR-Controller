import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, setToken, setUnauthorizedHandler, setNetworkErrorHandler } from '../services/api'
import * as authService from '../services/authService'
import * as repositoryService from '../services/repositoryService'
import * as alertService from '../services/alertService'

const AppContext = createContext(undefined)

// Backend severities are "critical" | "warning" | "info" — this UI
// also supports an "error" style for future use, but nothing on the
// backend produces it today.
const SEVERITY_TO_TYPE = {
  critical: 'critical',
  warning: 'warning',
  info: 'info'
}

function timeAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

// Maps the backend AlertResponse shape onto the fields the Alerts
// page's UI was originally built against.
function adaptAlert(alert) {
  return {
    id: alert.id,
    type: SEVERITY_TO_TYPE[alert.severity] || 'info',
    read: alert.is_read,
    age: timeAgo(alert.created_at),
    message: alert.message || alert.title,
    title: alert.title,
    alertType: alert.alert_type,
    pullRequestId: alert.pull_request_id,
    reviewerId: alert.reviewer_id
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const navigate = useNavigate()

  const [repos, setRepos] = useState([])
  const [reposLoading, setReposLoading] = useState(false)
  const [selectedRepoId, setSelectedRepoId] = useState('all')
  const [alerts, setAlerts] = useState([])
  const [toasts, setToasts] = useState([])

  // Toast dispatch helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const loadRepositories = useCallback(async () => {
    setReposLoading(true)
    try {
      const data = await repositoryService.getRepositories()
      setRepos(data)
    } catch (err) {
      showToast(err.message || 'Failed to load repositories', 'error')
    } finally {
      setReposLoading(false)
    }
  }, [showToast])

  const loadAlerts = useCallback(async () => {
    try {
      const data = await alertService.getAlerts()
      setAlerts(data.map(adaptAlert))
    } catch (err) {
      // Alerts are supplementary — a failed fetch shouldn't be loud
      // enough to interrupt the rest of the app.
      console.error('Failed to load alerts:', err)
    }
  }, [])

  // On mount: if a token exists, validate it against /auth/me and
  // restore the session. This also runs after a hard refresh.
  useEffect(() => {
    const token = getToken()

    if (!token) {
      setAuthLoading(false)
      return
    }

    authService
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  // Load repositories and alerts once we know who's logged in.
  useEffect(() => {
    if (user) {
      loadRepositories()
      loadAlerts()
    } else {
      setRepos([])
      setAlerts([])
    }
  }, [user, loadRepositories, loadAlerts])

  // If any API call gets a 401 (expired/invalid token), log the
  // user out cleanly and redirect to unauthorized page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      navigate('/unauthorized', { replace: true })
    })
  }, [navigate])

  // Handle network errors (offline, server unreachable)
  useEffect(() => {
    setNetworkErrorHandler(() => {
      // Don't redirect away from public pages (/, /features, /docs, etc.) on API errors
      const publicPaths = ['/', '/features', '/docs', '/contact', '/analysis-demo', '/login', '/register']
      const isPublic = publicPaths.includes(window.location.pathname)
      if (!isPublic || !navigator.onLine) {
        navigate('/network-error', { replace: true })
      }
    })
  }, [navigate])

  // Login handler — throws on failure so the calling page can show
  // its own error message.
  const login = useCallback(async (email, password) => {
    const loggedInUser = await authService.login(email, password)
    setUser(loggedInUser)
    showToast('Successfully authenticated!', 'success')
    return loggedInUser
  }, [showToast])

  // Register handler — throws on failure.
  const register = useCallback(async (username, email, password) => {
    const newUser = await authService.register(username, email, password)
    setUser(newUser)
    showToast('Account created!', 'success')
    return newUser
  }, [showToast])

  // Used by the GitHub OAuth callback page: the backend has already
  // authenticated the user and handed us a ready-made JWT via the
  // redirect URL. Store it and fetch the profile it belongs to.
  const loginWithToken = useCallback(async (token) => {
    setToken(token)
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
    setAuthLoading(false)
    showToast('Successfully authenticated with GitHub!', 'success')
    navigate('/dashboard', { replace: true })
    return currentUser
  }, [showToast, navigate])

  // Logout handler
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setRepos([])
    setAlerts([])
    showToast('Logged out successfully.', 'info')
    navigate('/login', { replace: true })
  }, [showToast, navigate])

  // Add repository (real backend call, syncs immediately server-side)
  const addRepository = useCallback(async (owner, name) => {
    showToast(`Connecting ${owner}/${name}...`, 'info')
    try {
      const newRepo = await repositoryService.addRepository(owner, name)
      setRepos((prev) => [...prev, newRepo])
      showToast(`Connected ${owner}/${name}`, 'success')
      // The initial sync (which may generate new alerts) happens
      // server-side as part of adding the repo, so refresh alerts
      // right after.
      loadAlerts()
      return newRepo
    } catch (err) {
      showToast(err.message || `Failed to connect ${owner}/${name}`, 'error')
      throw err
    }
  }, [showToast, loadAlerts])

  // Remove repository
  const removeRepository = useCallback(async (id) => {
    const repo = repos.find((r) => r.id === id)
    try {
      await repositoryService.deleteRepository(id)
      setRepos((prev) => prev.filter((r) => r.id !== id))
      showToast(
        repo ? `Removed ${repo.owner}/${repo.name}` : 'Repository removed',
        'warning'
      )
    } catch (err) {
      showToast(err.message || 'Failed to remove repository', 'error')
      throw err
    }
  }, [repos, showToast])

  // Mark a single alert as read (real backend call).
  const markAlertRead = useCallback(async (id) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert))
    )
    try {
      await alertService.markAlertRead(id)
    } catch (err) {
      showToast(err.message || 'Failed to update alert', 'error')
    }
  }, [showToast])

  // Mark every alert as read. Note: this does not delete alerts —
  // alerts clear themselves automatically once their underlying
  // condition resolves (PR merges, conflict clears, reviewer load
  // drops, etc). This just dismisses the "unread" indicator.
  const clearAllAlerts = useCallback(async () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })))
    try {
      await alertService.markAllAlertsRead()
      showToast('All alerts marked as read.', 'info')
    } catch (err) {
      showToast(err.message || 'Failed to update alerts', 'error')
    }
  }, [showToast])

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        repos,
        reposLoading,
        alerts,
        toasts,
        selectedRepoId,
        setSelectedRepoId,
        login,
        register,
        loginWithToken,
        logout,
        addRepository,
        removeRepository,
        loadRepositories,
        loadAlerts,
        markAlertRead,
        clearAllAlerts,
        showToast,
        navigate
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
