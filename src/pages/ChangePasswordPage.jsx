import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../axios'
import useUserStore from '../store/useUserStore'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const userId = useUserStore((s) => s.userId)
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    if (!newPassword || newPassword.length < 4) {
      setMessage('비밀번호는 4자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirm) {
      setMessage('비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (!userId) {
      setMessage('로그인 정보가 없습니다. 다시 로그인해 주세요.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/change-password', { userId, newPassword })
      navigate('/', { replace: true })
    } catch (err) {
      setMessage(err?.response?.data?.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
        <h1 className="text-2xl font-extrabold">강사 비밀번호 변경</h1>
        <p className="text-sm text-slate-400">초기 로그인 상태이므로 비밀번호를 변경해야 서비스를 이용할 수 있습니다.</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호"
          className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="새 비밀번호 확인"
          className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
        />
        {message && <p className="text-sm text-red-300">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-violet-600 px-4 py-2 font-semibold disabled:opacity-50"
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}

