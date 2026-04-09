import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Square } from 'lucide-react'
import useFocusTracker from '../hooks/useFocusTracker'
import FocusGauge from '../components/FocusGauge'
import useStudyStore from '../store/useStudyStore'
import useCourseStore from '../store/useCourseStore'
import useUserStore from '../store/useUserStore'
import api from '../axios'

const formatClock = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function VodStudyPage() {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const courseIdNum = courseIdParam != null && courseIdParam !== '' ? Number(courseIdParam) : NaN
  const validCourseId = Number.isFinite(courseIdNum) ? courseIdNum : null

  const userId = useUserStore((s) => s.userId)
  const {
    videoRef: camRef,
    focusScore,
    isTracking,
    startTracking,
    stopTracking,
    error: trackerError,
  } = useFocusTracker()

  const {
    setUserId,
    isStudying,
    elapsedSeconds,
    saving,
    startSession,
    tickSession,
    setSessionAverageFocusScore,
    stopAndSaveSession,
  } = useStudyStore()
  const setSelectedCourse = useCourseStore((s) => s.setSelectedCourse)
  const [courseTitle, setCourseTitle] = useState(null)

  useEffect(() => {
    const uid = userId != null ? userId : 1
    setUserId(uid)
  }, [userId, setUserId])

  useEffect(() => {
    let cancelled = false
    if (validCourseId == null) {
      setCourseTitle(null)
      setSelectedCourse({ title: 'VOD 강의실 (AI 분석실)' })
      return
    }
    setSelectedCourse({ id: validCourseId, title: '불러오는 중…' })
    void (async () => {
      try {
        const res = await api.get(`/api/courses/${validCourseId}`)
        if (cancelled) return
        const c = res.data
        const title = c?.title ?? '강의'
        setCourseTitle(title)
        setSelectedCourse({
          id: c?.id ?? validCourseId,
          title,
          accessCode: c?.accessCode,
        })
      } catch {
        if (cancelled) return
        setCourseTitle(null)
        setSelectedCourse({ id: validCourseId, title: '강의 (AI 분석실)' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [validCourseId, setSelectedCourse])

  useEffect(() => {
    if (!isStudying) return
    const timer = setInterval(() => {
      tickSession()
      setSessionAverageFocusScore(focusScore)
    }, 1000)
    return () => clearInterval(timer)
  }, [isStudying, tickSession, setSessionAverageFocusScore, focusScore])

  const handleToggleStudy = async () => {
    if (!isStudying) {
      await startTracking()
      startSession({
        meetingTitle: courseTitle ? `${courseTitle} · AI 분석 세션` : 'VOD 학습 세션',
      })
      return
    }

    try {
      await stopAndSaveSession()
      alert('집중 세션이 저장되었습니다.')
    } catch {
      alert('세션 저장에 실패했습니다.')
    } finally {
      stopTracking()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-700 bg-slate-800/70 p-6 shadow-xl lg:col-span-2">
          <h1 className="mb-4 text-2xl font-bold text-white">
            {courseTitle ? `${courseTitle} · AI 분석실` : 'VOD 학습 · AI 분석실'}
          </h1>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <video
              controls
              className="h-full w-full"
              src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">세션 시간: {formatClock(elapsedSeconds)}</p>
            <button
              onClick={handleToggleStudy}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-xl transition ${
                isStudying ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isStudying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isStudying ? '집중 종료' : '집중 시작'}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/70 p-4 shadow-xl">
            <h2 className="mb-3 text-sm font-semibold text-white">AI 캠 모드</h2>
            <video
              ref={camRef}
              muted
              playsInline
              className="aspect-video w-full rounded-2xl bg-slate-900 object-cover"
            />
            {trackerError && <p className="mt-2 text-xs text-red-400">{trackerError}</p>}
          </div>
          <FocusGauge focusScore={focusScore} isTracking={isTracking} />
        </section>
      </div>
    </div>
  )
}

export default VodStudyPage
