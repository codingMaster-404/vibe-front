import { useEffect, useState } from 'react'
import api from '../../axios'
import InstructorSelectModal from './InstructorSelectModal'

const CATEGORY_OPTIONS = [
  'IT/프로그래밍',
  '데이터 사이언스',
  '디자인',
  '비즈니스',
  '어학',
  '기타',
]

const WEEKDAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
]

const inputFocusClass =
  'w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition ' +
  'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/35'

const selectFocusClass =
  'w-full cursor-pointer rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition ' +
  'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/35'

function toHHmm(t) {
  if (!t || typeof t !== 'string') return ''
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t.trim()
  const h = String(Number(m[1])).padStart(2, '0')
  return `${h}:${m[2]}`
}

function buildScheduleString(dayKeys, startTime, endTime) {
  const order = ['mon', 'tue', 'wed', 'thu', 'fri']
  const labelByKey = Object.fromEntries(WEEKDAYS.map((w) => [w.key, w.label]))
  const selected = order.filter((k) => dayKeys.has(k)).map((k) => labelByKey[k])
  const start = toHHmm(startTime)
  const end = toHHmm(endTime)
  if (selected.length === 0 || !start || !end) return ''
  return `${selected.join(', ')} ${start} - ${end}`
}

export default function AdminCreateCourseModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructorId: '',
    category: '',
    schedule: '',
    sessionType: 'LIVE',
    coursePassword: '',
  })
  const [scheduleDays, setScheduleDays] = useState(() => new Set())
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('15:30')
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [selectOpen, setSelectOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) {
      setScheduleDays(new Set())
      setStartTime('14:00')
      setEndTime('15:30')
    }
  }, [open])

  if (!open) return null

  const toggleDay = (key) => {
    setScheduleDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const resetFormState = () => {
    setForm({
      title: '',
      description: '',
      instructorId: '',
      category: '',
      schedule: '',
      sessionType: 'LIVE',
      coursePassword: '',
    })
    setScheduleDays(new Set())
    setStartTime('14:00')
    setEndTime('15:30')
    setSelectedInstructor(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const schedule = buildScheduleString(scheduleDays, startTime, endTime)
    try {
      const res = await api.post('/api/admin/courses', {
        ...form,
        schedule,
        instructorId: Number(form.instructorId),
      })
      onCreated?.(res.data)
      onClose?.()
      resetFormState()
    } catch (e2) {
      setError(e2?.response?.data?.message || '강의 개설 실패')
    } finally {
      setSaving(false)
    }
  }

  const schedulePreview = buildScheduleString(scheduleDays, startTime, endTime)

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 [color-scheme:dark]">
        <div className="w-full max-w-xl rounded-2xl border border-violet-300/20 bg-slate-900 text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <h2 className="text-xl font-bold">강의 개설</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-slate-400 outline-none transition hover:text-slate-200 focus:ring-2 focus:ring-violet-500/50"
            >
              닫기
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">강의명</label>
              <input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                className={inputFocusClass}
                placeholder="강의명을 입력하세요"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">강의 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className={`${inputFocusClass} min-h-24 resize-y`}
                placeholder="강의 소개"
              />
            </div>

            <div className="rounded-xl border border-violet-500/35 bg-violet-950/20 px-3 py-3">
              <p className="mb-2 text-xs font-medium text-violet-200">담당 강사</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectOpen(true)}
                  className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold outline-none transition hover:bg-violet-500 focus:ring-2 focus:ring-violet-400/60"
                >
                  강사 선택
                </button>
                {selectedInstructor ? (
                  <span className="rounded-lg border border-violet-400/40 bg-violet-900/35 px-3 py-2 text-sm font-semibold text-violet-200">
                    {selectedInstructor.label}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">아직 선택되지 않음</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="course-category" className="mb-1 block text-xs font-medium text-slate-400">
                카테고리
              </label>
              <select
                id="course-category"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className={selectFocusClass}
              >
                <option value="">카테고리 선택</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-600/80 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-400">시간표</p>
              <p className="mb-2 text-[11px] text-slate-500">요일(월~금)을 선택하고, 강의 시간을 지정하세요.</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {WEEKDAYS.map(({ key, label }) => {
                  const on = scheduleDays.has(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={
                        'min-w-[2.5rem] rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition ' +
                        (on
                          ? 'border-violet-500 bg-violet-600/25 text-violet-100 shadow-sm shadow-violet-900/30 focus:ring-2 focus:ring-violet-500/50'
                          : 'border-slate-600 bg-slate-800/80 text-slate-400 hover:border-slate-500 hover:text-slate-300 focus:ring-2 focus:ring-slate-500/40')
                      }
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="course-start-time" className="mb-1 block text-[11px] text-slate-500">
                    시작 시간
                  </label>
                  <input
                    id="course-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputFocusClass}
                  />
                </div>
                <div>
                  <label htmlFor="course-end-time" className="mb-1 block text-[11px] text-slate-500">
                    종료 시간
                  </label>
                  <input
                    id="course-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputFocusClass}
                  />
                </div>
              </div>
              {schedulePreview ? (
                <p className="mt-3 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-300">
                  <span className="text-slate-500">전송 형식: </span>
                  {schedulePreview}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-600">요일을 하나 이상 선택하면 미리보기가 표시됩니다.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={saving || !form.instructorId}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold outline-none transition hover:bg-violet-500 focus:ring-2 focus:ring-violet-400/50 disabled:opacity-50"
            >
              {saving ? '개설 중...' : '개설 완료'}
            </button>
          </form>
        </div>
      </div>

      <InstructorSelectModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        onSelect={(ins) => {
          setSelectedInstructor(ins)
          setForm((s) => ({ ...s, instructorId: String(ins.userId) }))
          setSelectOpen(false)
        }}
      />
    </>
  )
}
