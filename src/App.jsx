import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/LoginPage'
import Signup from '@/pages/SignupPage'
import MachinesPage from '@/pages/MachinesPage'
import BookingsPage from '@/pages/BookingsPage'
import AdminDashboard from '@/pages/AdminDashboard'
import { useAuth } from '@/hooks/useAuth'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="h-screen w-screen flex items-center justify-center p-4">Loading...</div>
  if (!user) return <Navigate to="/login" />

  if (role && profile?.role !== role) {
    return <Navigate to="/" /> // Redirect to student dashboard if unauthorized
  }

  return children
}

function App() {
  return (
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
          <ProtectedRoute role="faculty">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Add other protected routes here */}

      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
