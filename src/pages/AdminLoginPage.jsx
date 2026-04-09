import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, ShieldCheck } from 'lucide-react'
import useUserStore from '../store/useUserStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const adminLogin = useUserStore((s) => s.adminLogin)
  const loading = useUserStore((s) => s.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [attemptHint, setAttemptHint] = useState(null)
  const [lockHint, setLockHint] = useState(null)

  const messageByCode = (code, fallback) => {
    if (code === 'ADMIN_ONLY') return '운영자 전용 계정만 로그인할 수 있습니다.'
    if (code === 'INVALID_CREDENTIALS') return '이메일 또는 비밀번호를 확인해 주세요.'
    if (code === 'ACCOUNT_LOCKED') return '계정이 잠금 상태입니다. 잠금 해제 후 다시 시도해 주세요.'
    return fallback
  }

  const parseAuthError = (payload) => {
    const rawText =
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : '운영자 로그인에 실패했습니다.'
    const text = messageByCode(payload?.code, rawText)
    const attemptsLeft =
      typeof payload?.remainingAttempts === 'number' ? payload.remainingAttempts : null
    const lockMinutes =
      typeof payload?.lockedMinutes === 'number' ? payload.lockedMinutes : null
    const isLocked = payload?.code === 'ACCOUNT_LOCKED'
    const attemptMatch = text.match(/남은 시도:\s*(\d+)회/)
    const lockMatch = text.match(/(\d+)분 후 다시 시도/)
    return {
      text,
      attemptsLeft: attemptsLeft ?? (attemptMatch ? Number(attemptMatch[1]) : null),
      lockMinutes: lockMinutes ?? (lockMatch ? Number(lockMatch[1]) : null),
      isLocked: isLocked || text.includes('잠겼'),
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setAttemptHint(null)
    setLockHint(null)
    try {
      const user = await adminLogin({ email: email.trim(), password })
      if (user?.role !== 'ADMIN') {
        navigate('/', { replace: true })
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const parsed = parseAuthError(err?.response?.data)
      setError(parsed.text)
      if (parsed.attemptsLeft != null) {
        setAttemptHint(`남은 로그인 시도 횟수: ${parsed.attemptsLeft}회`)
      }
      if (parsed.isLocked) {
        setLockHint(
          parsed.lockMinutes != null
            ? `계정 잠금 상태입니다. 약 ${parsed.lockMinutes}분 후 다시 시도해 주세요.`
            : '계정 잠금 상태입니다. 잠시 후 다시 시도해 주세요.',
        )
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <div className="w-full rounded-2xl border border-blue-900/70 bg-slate-950/80 p-7 shadow-2xl shadow-blue-900/30 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-900/40 p-2">
              <ShieldCheck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-blue-300">Admin Only</p>
              <h1 className="text-xl font-semibold text-blue-100">운영자 전용 로그인</h1>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <p className="rounded-md border border-blue-900/60 bg-blue-950/30 px-3 py-2 text-xs text-blue-200">
              보안 정책: 운영자 로그인 5회 연속 실패 시 30분간 계정이 잠깁니다.
            </p>

            <div>
              <label className="mb-1 block text-sm text-slate-300">이메일</label>
              <input
                className="w-full rounded-lg border border-blue-900/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vibe.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">비밀번호</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  className="w-full rounded-lg border border-blue-900/70 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-rose-800/60 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
            {attemptHint && (
              <p className="rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
                {attemptHint}
              </p>
            )}
            {lockHint && (
              <p className="flex items-center gap-2 rounded-md border border-rose-700/60 bg-rose-950/45 px-3 py-2 text-xs text-rose-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {lockHint}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '인증 중...' : '운영자 로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

