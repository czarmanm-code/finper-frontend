import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'
import Budget from './pages/Budget'
import Loans from './pages/Loans'
import Investments from './pages/Investments'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DateProvider } from './context/DateContext'
import { PrivacyProvider } from './context/PrivacyContext'
import ErrorBoundary from './components/ErrorBoundary'
import { forceResetScroll } from './utils/scrollLock'

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    forceResetScroll()
  }, [pathname])
  return null
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, isLoading, needsSetup } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-sm">
        Loading session...
      </div>
    )
  }

  if (needsSetup) {
    return <Navigate to="/register" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DateProvider>
            <PrivacyProvider>
              <BrowserRouter>
                <ScrollReset />
                <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Core Financial Views */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <ProtectedRoute>
                  <Categorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <Budget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <Loans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investments"
              element={
                <ProtectedRoute>
                  <Investments />
                </ProtectedRoute>
              }
            />

            {/* Admin-only Users Management */}
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* User Settings & Preferences */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </PrivacyProvider>
        </DateProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
  )
}
