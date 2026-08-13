import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getToken, setUnauthorizedHandler } from '../services/api'
import * as authService from '../services/authService'
import * as repositoryService from '../services/repositoryService'

const AppContext = createContext(undefined)

const INITIAL_ALERTS = []

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [repos, setRepos] = useState([])
  const [reposLoading, setReposLoading] = useState(false)
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

  // Load repositories once we know who's logged in.
  useEffect(() => {
    if (user) {
      loadRepositories()
    } else {
      setRepos([])
    }
  }, [user, loadRepositories])

  // If any API call gets a 401 (expired/invalid token), log the
  // user out cleanly instead of leaving the UI in a broken state.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      showToast('Your session expired. Please log in again.', 'warning')
    })
  }, [showToast])

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

  // Logout handler
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setRepos([])
    showToast('Logged out successfully.', 'info')
  }, [showToast])

  // Add repository (real backend call, syncs immediately server-side)
  const addRepository = useCallback(async (owner, name) => {
    showToast(`Connecting ${owner}/${name}...`, 'info')
    try {
      const newRepo = await repositoryService.addRepository(owner, name)
      setRepos((prev) => [...prev, newRepo])
      showToast(`Connected ${owner}/${name}`, 'success')
      return newRepo
    } catch (err) {
      showToast(err.message || `Failed to connect ${owner}/${name}`, 'error')
      throw err
    }
  }, [showToast])

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
        authLoading,
        repos,
        reposLoading,
        alerts,
        toasts,
        selectedRepoId,
        setSelectedRepoId,
        login,
        register,
        logout,
        addRepository,
        removeRepository,
        loadRepositories,
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
