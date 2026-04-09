import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '../../axios'

function formatSentAt(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    const d = new Date(value.replace(' ', 'T'))
    if (!Number.isNaN(d.getTime())) return d.toLocaleString('ko-KR')
    return value
  }
  return String(value)
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/notifications?limit=40')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="알림 (발송 이력)"
        className="relative rounded-lg border border-slate-700 p-2 text-slate-300 outline-none transition hover:bg-slate-800 hover:text-slate-100 focus:ring-2 focus:ring-violet-500/50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="border-b border-slate-700 px-3 py-2">
            <p className="text-sm font-semibold text-slate-100">알림함</p>
            <p className="text-[11px] text-slate-500">강의 코드 안내 발송 이력 (콘솔 연동)</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">불러오는 중…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">이력이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {items.map((row) => (
                  <li key={row.id} className="px-3 py-2.5 text-left">
                    <p className="text-[10px] text-slate-500">{formatSentAt(row.sentAt)}</p>
                    <p className="mt-0.5 text-xs text-violet-300/90">TO: {row.phone}</p>
                    <p className="mt-1 text-sm text-slate-200">{row.contentPreview}</p>
                    {row.accessCode ? (
                      <p className="mt-0.5 text-[11px] text-slate-500">코드: {row.accessCode}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
