import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/LoginPage'
import Signup from '@/pages/SignupPage'
import MachinesPage from '@/pages/MachinesPage'
import BookingsPage from '@/pages/BookingsPage'
import AdminDashboard from '@/pages/AdminDashboard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading, profileLoading } = useAuth()

  if (loading) return <div className="min-h-[100dvh] w-full flex items-center justify-center p-4">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  // Wait for profile to load before checking role-based access
  if (role) {
    if (profileLoading) {
      return <div className="min-h-[100dvh] w-full flex items-center justify-center p-4">Loading...</div>
    }
    // Profile fetch completed but returned null (error/missing row) — deny access
    if (!profile) {
      return <Navigate to="/" replace />
    }
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-[100dvh] w-full flex items-center justify-center p-4">Loading...</div>
  if (user) return <Navigate to="/" replace />

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/machines" element={
              <ProtectedRoute>
                <MachinesPage />
              </ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute role={['faculty', 'admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Catch-all: redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          <Toaster
            position="bottom-right"
            closeButton
            richColors
            duration={4000}
            toastOptions={{
              className: 'shadow-lg',
            }}
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
