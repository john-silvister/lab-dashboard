import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import Dashboard from '@/pages/Dashboard'
import AdminPanel from '@/pages/AdminPanel'
import Login from '@/pages/Login'
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

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute role="faculty">
            <Layout>
              <AdminPanel />
            </Layout>
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  )
}

export default App
