import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import useUserStore from './store/useUserStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import Dashboard from './pages/Dashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import VodStudyPage from './pages/VodStudyPage'
import LiveClassroomPage from './pages/LiveClassroomPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AppTopBar from './components/layout/AppTopBar'

function normalizePath(p) {
  if (!p) return '/'
  const s = p.split('?')[0].replace(/\/+$/, '')
  return s === '' ? '/' : s
}

/** 이미 목적지와 같으면 Navigate 하지 않음 → replaceState 루프 방지 */
function SafeNavigate({ to, replace = true }) {
  const loc = useLocation()
  const targetPath = typeof to === 'string' ? to.split('?')[0] : (to?.pathname ?? '/')
  if (normalizePath(loc.pathname) === normalizePath(targetPath)) {
    return null
  }
  return <Navigate to={to} replace={replace} />
}

function SessionBlockingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
      세션 확인 중…
    </div>
  )
}

function RequireAuth() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function homeForRole(role) {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'INSTRUCTOR') return '/instructor'
  return '/dashboard'
}

function RequireRole({ allow }) {
  const user = useUserStore((s) => s.user)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!user) return <SafeNavigate to="/" />
  if (!allow.includes(user.role)) {
    return <SafeNavigate to={homeForRole(user.role)} />
  }
  return <Outlet />
}

function RequireAdminRoute() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const user = useUserStore((s) => s.user)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!isAuthenticated) return <Navigate to="/admin/auth" replace />
  if (!user) return <SessionBlockingScreen />
  if (user.role !== 'ADMIN') return <SafeNavigate to="/" />
  return <Outlet />
}

function LoginGate() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const user = useUserStore((s) => s.user)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!isAuthenticated) return <LoginPage />
  if (!user) return <SessionBlockingScreen />
  if (user.role === 'ADMIN') return <SafeNavigate to="/admin/dashboard" />
  if (user.role === 'INSTRUCTOR') return <SafeNavigate to="/instructor" />
  return <SafeNavigate to="/dashboard" />
}

function AdminLoginGate() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const user = useUserStore((s) => s.user)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!isAuthenticated) return <AdminLoginPage />
  if (!user) return <SessionBlockingScreen />
  if (user.role === 'ADMIN') return <SafeNavigate to="/admin/dashboard" />
  return <SafeNavigate to="/" />
}

function CatchAllRedirect() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (isAuthenticated) return <SafeNavigate to="/" />
  return <Navigate to="/login" replace />
}

function HomeByRole() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const user = useUserStore((s) => s.user)
  const sessionResolved = useUserStore((s) => s.sessionResolved)
  if (!sessionResolved) return <SessionBlockingScreen />
  if (!isAuthenticated) return <LandingPage />
  if (!user) return <SessionBlockingScreen />
  if (user.role === 'INSTRUCTOR') return <SafeNavigate to="/instructor" />
  if (user.role === 'ADMIN') return <SafeNavigate to="/admin/dashboard" />
  return <SafeNavigate to="/dashboard" />
}

function App() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const sessionResolved = useUserStore((s) => s.sessionResolved)

  React.useEffect(() => {
    let cancelled = false
    async function bootstrapSession() {
      const { isAuthenticated: authed, userId, user, fetchUser, logout } = useUserStore.getState()
      if (!authed || userId == null) {
        useUserStore.setState({ sessionResolved: true })
        return
      }
      if (user != null) {
        useUserStore.setState({ sessionResolved: true })
        return
      }
      const ok = await fetchUser()
      if (cancelled) return
      if (!ok || useUserStore.getState().user == null) {
        await logout()
      }
      useUserStore.setState({ sessionResolved: true })
    }
    void bootstrapSession()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Router>
      {isAuthenticated && sessionResolved && <AppTopBar />}
      <Routes>
        <Route path="/" element={<HomeByRole />} />
        <Route path="/login" element={<LoginGate />} />
        <Route path="/admin/auth" element={<AdminLoginGate />} />

        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['STUDENT']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vod-study" element={<VodStudyPage />} />
            <Route path="/live-classroom" element={<LiveClassroomPage />} />
          </Route>

          <Route element={<RequireRole allow={['INSTRUCTOR']} />}>
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route element={<RequireAdminRoute />}>
          <Route path="/admin" element={<SafeNavigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </Router>
  )
}

export default App
