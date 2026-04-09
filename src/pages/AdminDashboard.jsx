import { useEffect, useState } from 'react'
import { Activity, BookOpen, UserCheck, Users } from 'lucide-react'
import api from '../axios'
import AdminCreateCourseModal from '../components/admin/AdminCreateCourseModal'

function formatServerTime(value) {
  if (!value) return '-'
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toLocaleString('ko-KR')
  }
  return '-'
}

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-600/80 bg-[#1e293b] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
        </div>
        {Icon ? (
          <div className="shrink-0 rounded-lg bg-blue-900/35 p-2.5">
            <Icon className="h-6 w-6 text-blue-300" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function statsErrorMessage(err) {
  const d = err?.response?.data
  if (typeof d?.message === 'string' && d.message.trim()) return d.message
  if (typeof d === 'string' && d.trim()) return d
  return '통계 데이터를 불러오지 못했습니다.'
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const selectFocusClass =
  'w-full cursor-pointer rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition ' +
  'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/35'

export default function AdminDashboard() {
  const [file, setFile] = useState(null)
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => new Set())
  const [enrollmentListError, setEnrollmentListError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')

  const loadStats = async (opts = {}) => {
    const { afterMs = 0 } = opts
    try {
      setStatsError('')
      if (afterMs > 0) await delay(afterMs)
      const res = await api.get('/api/admin/stats')
      setStats(res.data)
    } catch (e) {
      if (e?.response?.status === 401) {
        // axios 응답 인터셉터에서 세션 정리 후 /admin/auth 로 이동
        return
      }
      setStatsError(statsErrorMessage(e))
    }
  }

  useEffect(() => {
    void loadStats()
  }, [])

  const loadEnrollmentLists = async () => {
    try {
      setEnrollmentListError('')
      const [coursesRes, usersRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/users'),
      ])
      const courseList = Array.isArray(coursesRes.data) ? coursesRes.data : []
      setCourses(courseList.filter((c) => c.isActive !== false))
      const userList = Array.isArray(usersRes.data) ? usersRes.data : []
      setStudents(userList.filter((u) => u.role === 'STUDENT'))
    } catch (e) {
      if (e?.response?.status === 401) return
      setEnrollmentListError(e?.response?.data?.message || '강의·학생 목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    void loadEnrollmentLists()
  }, [])

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllStudents = () => {
    setSelectedStudentIds(new Set(students.map((s) => s.id)))
  }

  const clearStudentSelection = () => {
    setSelectedStudentIds(new Set())
  }

  const importCsv = async () => {
    if (!file) return
    setLoading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/api/admin/users/import-csv', form)
      setMessage(`CSV 등록 완료: ${JSON.stringify(res.data)}`)
      await loadStats()
      await loadEnrollmentLists()
    } catch (e) {
      setMessage(e?.response?.data?.message || 'CSV 등록 실패')
    } finally {
      setLoading(false)
    }
  }

  const assignStudentsBulk = async () => {
    const ids = [...selectedStudentIds]
    if (!selectedCourseId || ids.length === 0) return
    setLoading(true)
    setMessage('')
    try {
      const res = await api.post(`/api/admin/courses/${selectedCourseId}/enrollments/bulk`, {
        studentIds: ids,
      })
      setMessage(`수강생 일괄 배정 완료: ${JSON.stringify(res.data)}`)
      clearStudentSelection()
      await loadStats()
      await loadEnrollmentLists()
    } catch (e) {
      setMessage(e?.response?.data?.message || '수강생 일괄 배정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel =
    stats?.systemStatus === 'Healthy' || stats?.systemStatus === '정상' ? '정상' : stats?.systemStatus || '정상'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">운영자 대시보드</h1>
          <span className="rounded-full border border-blue-400/40 bg-blue-900/30 px-3 py-1 text-xs text-blue-200">
            Admin Control
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="총 학생 수"
            value={(stats?.studentCount ?? 0).toLocaleString()}
            sub="등록된 학생 계정"
            icon={Users}
          />
          <StatCard
            label="총 강사 수"
            value={(stats?.instructorCount ?? 0).toLocaleString()}
            sub="등록된 강사 계정"
            icon={UserCheck}
          />
          <StatCard
            label="활성 강의"
            value={(stats?.activeCourses ?? 0).toLocaleString()}
            sub="개설 중인 강의"
            icon={BookOpen}
          />
          <StatCard
            label="시스템 상태"
            value={statusLabel}
            sub={`서버 시각: ${formatServerTime(stats?.serverTime)}`}
            icon={Activity}
          />
        </div>
        {statsError && (
          <p className="rounded-md border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {statsError}
          </p>
        )}

        <button
          onClick={() => setCreateOpen(true)}
          className="w-fit rounded bg-violet-600 px-4 py-2 text-sm font-semibold"
        >
          강의 개설
        </button>

        <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="font-bold">CSV 유저 대량 등록</h2>
          <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            onClick={() => void importCsv()}
            disabled={loading || !file}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            CSV 업로드
          </button>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div>
            <h2 className="font-bold text-slate-100">수강생 일괄 배정</h2>
            <p className="mt-1 text-sm text-slate-400">
              개설된 강의를 고르고, 함께 들을 학생을 체크한 뒤 배정하면 됩니다.
            </p>
          </div>

          {enrollmentListError && (
            <p className="rounded-md border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
              {enrollmentListError}
            </p>
          )}

          <div>
            <label htmlFor="admin-bulk-course" className="mb-1 block text-xs font-medium text-slate-400">
              강의 선택
            </label>
            <select
              id="admin-bulk-course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className={selectFocusClass}
            >
              <option value="">강의를 선택하세요</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                  {c.accessCode ? ` (${c.accessCode})` : ''}
                  {c.instructorName ? ` · ${c.instructorName}` : ''}
                </option>
              ))}
            </select>
            {courses.length === 0 && !enrollmentListError && (
              <p className="mt-1 text-xs text-slate-500">등록된 강의가 없습니다. 먼저 강의를 개설해 주세요.</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-400">학생 선택</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllStudents}
                  disabled={students.length === 0 || loading}
                  className="rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 outline-none transition hover:bg-slate-700 focus:ring-2 focus:ring-violet-500/40 disabled:opacity-40"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={clearStudentSelection}
                  disabled={selectedStudentIds.size === 0 || loading}
                  className="rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 outline-none transition hover:bg-slate-700 focus:ring-2 focus:ring-violet-500/40 disabled:opacity-40"
                >
                  선택 해제
                </button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-600 bg-slate-950/80 p-2">
              {students.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-slate-500">등록된 학생 계정이 없습니다.</p>
              ) : (
                <ul className="space-y-1">
                  {students.map((s) => {
                    const checked = selectedStudentIds.has(s.id)
                    return (
                      <li key={s.id}>
                        <label
                          className={
                            'flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-slate-800/80 ' +
                            (checked ? 'bg-violet-950/25' : '')
                          }
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(s.id)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-500 bg-slate-900 text-violet-600 focus:ring-2 focus:ring-violet-500/50"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-slate-100">{s.nickname || '이름 없음'}</span>
                            <span className="block truncate text-xs text-slate-500">{s.email}</span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              선택됨: <span className="text-violet-300">{selectedStudentIds.size}</span>명
            </p>
          </div>

          <button
            type="button"
            onClick={() => void assignStudentsBulk()}
            disabled={loading || !selectedCourseId || selectedStudentIds.size === 0}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold outline-none transition hover:bg-violet-500 focus:ring-2 focus:ring-violet-400/50 disabled:opacity-50"
          >
            {loading ? '처리 중…' : '선택한 학생 배정하기'}
          </button>
        </section>

        {message && <p className="text-sm text-slate-300">{message}</p>}

        <AdminCreateCourseModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(course) => {
            setMessage(`강의 개설 완료: ${course?.title} (코드: ${course?.accessCode})`)
            void (async () => {
              await loadStats({ afterMs: 250 })
              await loadEnrollmentLists()
            })()
          }}
        />
      </div>
    </div>
  )
}
