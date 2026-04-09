import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, LogIn, School } from 'lucide-react'
import useUserStore from '../store/useUserStore'
import api from '../axios'

/** 로그인 화면 — POST /api/login (vibeBack) */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error } = useUserStore()
  const [tab, setTab] = useState('instructor')
  const [instructorEmail, setInstructorEmail] = useState('')
  const [instructorPassword, setInstructorPassword] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [studentBirth, setStudentBirth] = useState('')
  const [studentCodeVerified, setStudentCodeVerified] = useState(false)
  const [verifiedCourse, setVerifiedCourse] = useState(null)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)

  const handleInstructorSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setInfoMessage(null)
    try {
      const loggedIn = await login({ email: instructorEmail, password: instructorPassword })
      if (loggedIn?.requirePasswordChange) {
        navigate('/change-password', { replace: true })
        return
      }
      navigate('/', { replace: true })
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      setLocalError(
        typeof apiMsg === 'string' && apiMsg
          ? apiMsg
          : '로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요.',
      )
    }
  }

  const verifyCourseCode = async () => {
    if (!courseCode.trim()) {
      setLocalError('강의 코드를 입력해 주세요.')
      return
    }
    setLocalError(null)
    setInfoMessage(null)
    setVerifyingCode(true)
    try {
      const res = await api.get(`/api/courses/access-code/${encodeURIComponent(courseCode.trim())}`)
      setVerifiedCourse(res.data)
      setStudentCodeVerified(true)
      setInfoMessage(`강의 코드 확인 완료: ${res.data?.title ?? '강의명 미확인'}`)
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      setStudentCodeVerified(false)
      setVerifiedCourse(null)
      setLocalError(
        typeof apiMsg === 'string' && apiMsg
          ? apiMsg
          : '강의 코드를 확인할 수 없습니다. 다시 입력해 주세요.',
      )
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setInfoMessage(null)
    if (!studentCodeVerified) {
      setLocalError('먼저 강의 코드를 확인해 주세요.')
      return
    }
    if (!studentBirth.trim() || studentBirth.trim().length !== 6) {
      setLocalError('생년월일 6자리를 YYMMDD 형식으로 입력해 주세요.')
      return
    }
    try {
      // 학생 로그인은 생년월일 6자리를 인증키로 사용 (백엔드 password 비교값에도 동일 값 전달)
      await login({
        email: null,
        password: null,
        accessCode: courseCode.trim().toUpperCase(),
        birthDate: studentBirth.trim(),
      })
      navigate('/', { replace: true })
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      setLocalError(
        typeof apiMsg === 'string' && apiMsg
          ? apiMsg
          : '학생 로그인에 실패했습니다. 정보를 확인해 주세요.',
      )
    }
  }

  const message = localError || (error ? String(error.message || error) : null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1020] to-[#111827] text-slate-200 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl rounded-2xl border border-violet-300/20 bg-slate-900/90 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <LogIn size={22} />
          </span>
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Vibe</p>
            <h1 className="text-2xl font-extrabold text-white">통합 로그인</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          강사/학생 로그인 유형을 선택한 뒤 계정 정보를 입력해 주세요.
        </p>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('instructor')
              setLocalError(null)
              setInfoMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === 'instructor'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <School size={16} />
              강사 로그인
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('student')
              setLocalError(null)
              setInfoMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === 'student'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={16} />
              학생 로그인
            </span>
          </button>
        </div>

        {tab === 'instructor' ? (
          <form onSubmit={handleInstructorSubmit} className="space-y-4">
            <div>
              <label htmlFor="instructor-email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                이메일
              </label>
              <input
                id="instructor-email"
                type="email"
                autoComplete="username"
                value={instructorEmail}
                onChange={(e) => setInstructorEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="instructor@vibe.com"
              />
            </div>
            <div>
              <label htmlFor="instructor-password" className="block text-xs font-semibold text-slate-400 mb-1.5">
                비밀번호
              </label>
              <input
                id="instructor-password"
                type="password"
                autoComplete="current-password"
                value={instructorPassword}
                onChange={(e) => setInstructorPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? '로그인 중…' : '강사 로그인'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label htmlFor="course-code" className="block text-xs font-semibold text-slate-400 mb-1.5">
                강의 코드(기관코드)
              </label>
              <div className="flex gap-2">
                <input
                  id="course-code"
                  type="text"
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(e.target.value)
                    setStudentCodeVerified(false)
                    setVerifiedCourse(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="예: ABC123"
                />
                <button
                  type="button"
                  onClick={verifyCourseCode}
                  disabled={verifyingCode}
                  className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  {verifyingCode ? '확인중' : '코드확인'}
                </button>
              </div>
              {verifiedCourse?.title && (
                <p className="mt-2 text-xs text-violet-300">확인된 강의: {verifiedCourse.title}</p>
              )}
            </div>
            <div>
              <label htmlFor="student-birth" className="block text-xs font-semibold text-slate-400 mb-1.5">
                생년월일 6자리
              </label>
              <input
                id="student-birth"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={studentBirth}
                onChange={(e) => setStudentBirth(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="YYMMDD"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !courseCode.trim() || studentBirth.trim().length !== 6}
              className="w-full rounded-lg bg-violet-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? '로그인 중…' : '학생 로그인'}
            </button>
            {!studentCodeVerified && (
              <p className="text-xs text-slate-400">
                로그인 전 강의 코드를 먼저 확인해 주세요.
              </p>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
          로컬 시드 계정: <span className="text-slate-400">test@vibe.com</span> / 1234 (학생),
          <br />
          <span className="text-slate-400">instructor@vibe.com</span> / 1234 (강사)
        </p>
        {infoMessage && (
          <p className="mt-3 text-sm text-violet-300" role="status">
            {infoMessage}
          </p>
        )}
        {message && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
