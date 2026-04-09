import { Link, NavLink, useLocation } from 'react-router-dom'
import useUserStore from '../../store/useUserStore'
import useCourseStore from '../../store/useCourseStore'
import AdminNotificationBell from './AdminNotificationBell'

const pageName = (path, selectedCourse) => {
  if (selectedCourse?.title) return selectedCourse.title
  if (path.startsWith('/dashboard')) return '대시보드'
  if (path.startsWith('/vod-study')) return 'VOD 강의실'
  if (path.startsWith('/live-classroom')) return '실시간 강의실'
  if (path.startsWith('/instructor')) return '강사 관제탑'
  if (path.startsWith('/admin')) return '강의 관리/개설'
  if (path.startsWith('/change-password')) return '비밀번호 변경'
  return '대시보드'
}

export default function AppTopBar() {
  const location = useLocation()
  const user = useUserStore((s) => s.user)
  const logout = useUserStore((s) => s.logout)
  const selectedCourse = useCourseStore((s) => s.selectedCourse)
  if (!user) return null

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded text-sm ${isActive ? 'bg-violet-700 text-white' : 'text-slate-200 hover:bg-slate-800'}`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-violet-300 font-bold">Vibe</Link>
            {user.role === 'ADMIN' && <NavLink to="/admin" className={linkClass}>강의 관리/개설</NavLink>}
            {user.role === 'INSTRUCTOR' && <NavLink to="/instructor" className={linkClass}>강사 관제탑</NavLink>}
            {user.role === 'STUDENT' && <NavLink to="/dashboard" className={linkClass}>대시보드</NavLink>}
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && <AdminNotificationBell />}
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs rounded border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
            >
              로그아웃
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          홈 <span className="mx-1">/</span> <span className="text-violet-300">{pageName(location.pathname, selectedCourse)}</span>
        </p>
      </div>
    </header>
  )
}

