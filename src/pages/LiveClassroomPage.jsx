import { Mic, Video, MessageSquare, Users } from 'lucide-react'
import { useEffect } from 'react'
import useCourseStore from '../store/useCourseStore'

function LiveClassroomPage() {
  const setSelectedCourse = useCourseStore((s) => s.setSelectedCourse)

  useEffect(() => {
    setSelectedCourse({ title: '실시간 강의실' })
  }, [setSelectedCourse])

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="rounded-3xl border border-slate-700 bg-slate-800/70 p-4 shadow-xl lg:col-span-3">
          <h1 className="mb-4 text-xl font-bold text-white">Live Classroom</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-video rounded-2xl bg-slate-900 p-3">
              <p className="text-xs text-slate-500">강사 화면</p>
            </div>
            <div className="aspect-video rounded-2xl bg-slate-900 p-3">
              <p className="text-xs text-slate-500">내 화면</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">
              <Mic className="h-4 w-4" />
              마이크
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">
              <Video className="h-4 w-4" />
              카메라
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
              수업 참여 중
            </button>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-700 bg-slate-800/70 p-4 shadow-xl">
          <h2 className="mb-3 text-sm font-semibold text-white">클래스 패널</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4" />
              참여자 12명
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MessageSquare className="h-4 w-4" />
              실시간 채팅
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default LiveClassroomPage
