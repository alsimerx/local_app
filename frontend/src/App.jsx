import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RequestsPage from './pages/RequestsPage'
import NewRequestPage from './pages/NewRequestPage'
import RequestDetailPage from './pages/RequestDetailPage'
import ApprovalsPage from './pages/ApprovalsPage'
import TemplatesPage from './pages/admin/TemplatesPage'
import UsersPage from './pages/admin/UsersPage'
import SettingsPage from './pages/admin/SettingsPage'
import ReportsPage from './pages/admin/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import PetitionPage from './pages/PetitionPage'
import LandingPage from './pages/LandingPage'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">กำลังโหลด...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/petition" element={<PetitionPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/new" element={<NewRequestPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/templates" element={<PrivateRoute adminOnly><TemplatesPage /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute adminOnly><SettingsPage /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute adminOnly><ReportsPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
