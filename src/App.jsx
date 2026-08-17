import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext'

// Layouts and Shared Components
import Sidebar from './components/shared/Sidebar'
import Toast from './components/shared/Toast'
import ErrorBoundary from './components/ErrorBoundary'

// Public Pages
import Home from './pages/public/Home'
import Features from './pages/public/Features'
import Docs from './pages/public/Docs'
import Contact from './pages/public/Contact'
import AnalysisDemo from './pages/public/AnalysisDemo'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import GithubCallback from './pages/auth/GithubCallback'

// App Pages
import Dashboard from './pages/app/Dashboard'
import PullRequests from './pages/app/PullRequests'
import PRDetails from './pages/app/PRDetails'
import DependencyGraph from './pages/app/DependencyGraph'
import ReviewerAnalytics from './pages/app/ReviewerAnalytics'
import EngineeringAnalytics from './pages/app/EngineeringAnalytics'
import Repositories from './pages/app/Repositories'
import Alerts from './pages/app/Alerts'
import Settings from './pages/app/Settings'
import Profile from './pages/app/Profile'

// Error Pages
import NotFound from './pages/error/NotFound'
import Unauthorized from './pages/error/Unauthorized'
import ServerError from './pages/error/ServerError'
import NetworkError from './pages/error/NetworkError'

function DashboardLayout() {
  const { user, authLoading } = useApp()

  // While we're still checking a stored token against /auth/me,
  // don't redirect yet — otherwise a valid session gets bounced to
  // /login for a flash on every page refresh.
  if (authLoading) {
    return (
      <div className="app-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-void)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-40)' }}>
          <div className="loading-mark" style={{ margin: '0 auto 1.5rem' }} />
          <div className="loading-wordmark">PRFlow Intelligence</div>
          <div className="loading-track" style={{ margin: '1.5rem auto 0', width: '180px' }}>
            <div className="loading-fill" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if user session is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary fallback={<ServerError />}>
          <Routes>
            {/* Public Website Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/analysis-demo" element={<AnalysisDemo />} />
            <Route path="/features" element={<Features />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/contact" element={<Contact />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/github-callback" element={<GithubCallback />} />

            {/* Error Routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="/network-error" element={<NetworkError />} />

            {/* Protected Application Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prs" element={<PullRequests />} />
              <Route path="/prs/:id" element={<PRDetails />} />
              <Route path="/dependencies" element={<DependencyGraph />} />
              <Route path="/reviewers" element={<ReviewerAnalytics />} />
              <Route path="/analytics" element={<EngineeringAnalytics />} />
              <Route path="/repositories" element={<Repositories />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <Toast />
      </AppProvider>
    </BrowserRouter>
  )
}
