import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import api from '../../axios'

/**
 * 학생 대시보드 — 수강 중 강의 목록 (GET /api/courses/enrolled?userId=)
 */
export default function StudentMyCourseList({ userId }) {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const load = useCallback(async () => {
    if (userId == null) {
      setCourses([])
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      const res = await api.get('/api/courses/enrolled', { params: { userId } })
      setCourses(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setFetchError(e)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const goLectureRoom = (courseId) => {
    navigate(`/vod-study?courseId=${courseId}`)
  }

  return (
    <section className="bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
      <div className="mb-6 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-violet-400" aria-hidden />
        <h3 className="text-lg font-bold text-white">참여 중인 강의</h3>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 rounded-2xl bg-slate-700/40 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-700/40 animate-pulse" />
        </div>
      ) : fetchError ? (
        <p className="text-sm text-red-400">
          강의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-slate-400 leading-relaxed">
          현재 참여 중인 강의가 없습니다. 강의 코드를 확인해 주세요.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <li
              key={c.id}
              className="flex flex-col rounded-2xl border border-slate-600/80 bg-slate-900/50 p-4 shadow-inner"
            >
              <p className="text-base font-semibold text-white">{c.title}</p>
              {c.instructorName ? (
                <p className="mt-1 text-xs text-slate-500">강사 {c.instructorName}</p>
              ) : null}
              {c.schedule ? (
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{c.schedule}</p>
              ) : null}
              {c.accessCode ? (
                <p className="mt-2 text-[11px] font-mono text-slate-500">코드 {c.accessCode}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => goLectureRoom(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  강의실 입장
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
