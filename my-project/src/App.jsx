import React from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import AddReading from './Pages/Add_Reading'
import Dashboard from './Pages/Dashboard'
import History from './Pages/History'
import Login from './Pages/login'
import MainPage from './Pages/main_page'
import Report from './Pages/Report'
import Settings from './Pages/Settings'
import SignIn from './Pages/sign_in'

const ProtectedRoute = () => {
  const { user, loading, authError } = useAuth()
  if (loading) return <p role="status">Loading your account…</p>
  if (authError) return <p role="alert">{authError} <Link to="/login">Go to login</Link></p>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

const AppRoutes = () => (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/register" element={<SignIn />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logn" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainPage />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-reading" element={<AddReading />} />
          <Route path="/reports" element={<Report />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
)

export default App
