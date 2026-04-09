import { useEffect, useMemo, useState } from 'react'
import api from '../../axios'

export default function InstructorSelectModal({ open, onClose, onSelect }) {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async (k = '') => {
    setLoading(true)
    setError(null)
    try {
      const qs = k ? `?keyword=${encodeURIComponent(k)}` : ''
      const res = await api.get(`/api/admin/instructors${qs}`)
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e?.response?.data?.message || '강사 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void load('')
  }, [open])

  const filtered = useMemo(() => items, [items])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-violet-300/20 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-lg font-bold">강사 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">닫기</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="이름/이메일/전문분야 검색"
              className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void load(keyword)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
            >
              검색
            </button>
          </div>
          {loading && <p className="text-sm text-slate-300">불러오는 중...</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="max-h-72 overflow-auto space-y-2">
            {filtered.map((i) => (
              <button
                key={i.userId}
                onClick={() => onSelect(i)}
                className="w-full rounded-xl border border-violet-400/30 bg-violet-950/20 px-4 py-3 text-left hover:bg-violet-900/35 transition"
              >
                <p className="font-semibold text-violet-200">{i.label}</p>
                <p className="text-xs text-slate-300">{i.email}</p>
              </button>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-slate-400">표시할 강사가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

