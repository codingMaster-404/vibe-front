import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import useUserStore from '../store/useUserStore'
import api from '../axios'

const scoreToTone = (score) => {
  if (score >= 75) return { bg: '#14532d', border: '#22c55e', text: '#86efac', label: '집중' }
  if (score >= 45) return { bg: '#78350f', border: '#f59e0b', text: '#fde68a', label: '주의' }
  return { bg: '#7f1d1d', border: '#ef4444', text: '#fecaca', label: '위험' }
}

export default function InstructorDashboard() {
  const user = useUserStore((s) => s.user)
  const [myCourses, setMyCourses] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [cardsRes, coursesRes] = await Promise.all([
        api.get(`/api/enrollments/instructor/${user.id}/monitor-grid`),
        api.get(`/api/courses/instructor/${user.id}`),
      ])
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : [])
      setMyCourses(Array.isArray(coursesRes.data) ? coursesRes.data : [])
    } catch (e) {
      setError(e?.response?.data?.message || '강사 관제탑 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return undefined
    const t = setInterval(() => void load(), 10000)
    return () => clearInterval(t)
  }, [user?.id])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const c of cards) {
      const key = `${c.courseId}:${c.courseTitle}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    }
    return [...map.entries()]
  }, [cards])

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Instructor Control Tower</p>
            <h1 className="text-3xl font-extrabold">강사 관제탑</h1>
          </div>
          <button
            onClick={() => void load()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
          >
            새로고침
          </button>
        </div>

        {loading && <p className="text-slate-300 mb-3">데이터 로딩 중...</p>}
        {error && <p className="text-red-300 mb-3">{error}</p>}
        {!loading && myCourses.length > 0 && (
          <div className="mb-6 rounded-xl border border-violet-400/30 bg-violet-950/20 p-4">
            <p className="text-sm font-semibold text-violet-200 mb-2">내 강의 목록</p>
            <div className="flex flex-wrap gap-2">
              {myCourses.map((c) => (
                <span
                  key={c.id}
                  className="text-xs px-2 py-1 rounded-lg border border-violet-400/40 bg-violet-900/35 text-violet-100"
                >
                  {c.title} · 코드 {c.accessCode}
                </span>
              ))}
            </div>
          </div>
        )}
        {!loading && cards.length === 0 && (
          <p className="text-slate-400">표시할 수강생 카드가 없습니다. 시드 데이터/수강 매핑을 확인해 주세요.</p>
        )}

        {grouped.map(([courseKey, students]) => (
          <section key={courseKey} className="mb-8">
            <h2 className="text-lg font-bold mb-3">{courseKey.split(':')[1]}</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {students.map((s) => {
                const tone = scoreToTone(Number(s.currentFocusScore || 0))
                const trend = (s.trend5m || []).map((v, i) => ({ idx: i, score: Number(v || 0) }))
                return (
                  <article
                    key={`${s.courseId}-${s.studentId}`}
                    className="rounded-xl border p-3"
                    style={{ background: tone.bg, borderColor: tone.border }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold">{s.nickname}</p>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(15,23,42,0.45)', color: tone.text }}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200/90 mb-2">현재 집중도: {s.currentFocusScore ?? 0}점</p>
                    <div className="h-16 w-full rounded bg-slate-900/30 p-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend}>
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke={tone.border}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-200/80">최근 5분 집중도 추이</p>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

