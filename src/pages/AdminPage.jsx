import { useState } from 'react'
import api from '../axios'
import AdminCreateCourseModal from '../components/admin/AdminCreateCourseModal'

export default function AdminPage() {
  const [file, setFile] = useState(null)
  const [courseId, setCourseId] = useState('')
  const [studentIds, setStudentIds] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const importCsv = async () => {
    if (!file) return
    setLoading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/api/admin/users/import-csv', form)
      setMessage(`CSV 등록 완료: ${JSON.stringify(res.data)}`)
    } catch (e) {
      setMessage(e?.response?.data?.message || 'CSV 등록 실패')
    } finally {
      setLoading(false)
    }
  }

  const bulkMap = async () => {
    setLoading(true)
    setMessage('')
    try {
      const ids = studentIds
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v))
      const res = await api.post(`/api/admin/courses/${courseId}/enrollments/bulk`, { studentIds: ids })
      setMessage(`수강 매핑 완료: ${JSON.stringify(res.data)}`)
    } catch (e) {
      setMessage(e?.response?.data?.message || '수강 매핑 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">운영자 관리 콘솔</h1>
          <span className="text-xs px-3 py-1 rounded-full bg-violet-900/40 border border-violet-400/40 text-violet-200">
            강의 관리/개설
          </span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold w-fit"
        >
          강의 개설
        </button>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
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

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <h2 className="font-bold">강의-학생 벌크 매핑</h2>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
            placeholder="courseId"
          />
          <input
            value={studentIds}
            onChange={(e) => setStudentIds(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
            placeholder="studentIds (comma separated) e.g. 2,3,4,5"
          />
          <button
            onClick={() => void bulkMap()}
            disabled={loading || !courseId || !studentIds}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            벌크 매핑 실행
          </button>
        </section>

        {message && <p className="text-sm text-slate-300">{message}</p>}

        <AdminCreateCourseModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(course) => setMessage(`강의 개설 완료: ${course?.title} (코드: ${course?.accessCode})`)}
        />
      </div>
    </div>
  )
}

