import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/LoginPage'
import Signup from '@/pages/SignupPage'
import MachinesPage from '@/pages/MachinesPage'
import BookingsPage from '@/pages/BookingsPage'
import AdminDashboard from '@/pages/AdminDashboard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="h-screen w-screen flex items-center justify-center p-4">Loading...</div>
  if (!user) return <Navigate to="/login" />

  // Support both single role and array of roles
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!allowedRoles.includes(profile?.role)) {
      return <Navigate to="/" /> // Redirect to student dashboard if unauthorized
    }
  }

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

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

          {/* Add other protected routes here */}

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
    </ErrorBoundary>
  )
}

export default App
