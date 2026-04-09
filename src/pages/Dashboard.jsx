import { useEffect, useMemo, useState } from 'react'
import { User2, Trash2, LogOut, Play, Square } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/useUserStore'
import useCourseStore from '../store/useCourseStore'
import api from '../axios'
import StudentMyCourseList from '../components/dashboard/StudentMyCourseList'

const formatMinutesToKoreanTime = (minutes) => {
  const totalMinutes = Number(minutes) || 0
  const hours = Math.floor(totalMinutes / 60)
  const remainMinutes = totalMinutes % 60

  if (hours === 0) return `${remainMinutes}분`
  if (remainMinutes === 0) return `${hours}시간`
  return `${hours}시간 ${remainMinutes}분`
}

const WEEK_KR = ['월', '화', '수', '목', '금', '토', '일']

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    user,
    userId,
    weeklyProgress,
    compareChartData,
    gaugeChartData,
    studyLogs,
    loading,
    fetchUser,
    fetchWeeklyProgress,
    fetchStudyLogs,
    logStudySession,
    deleteStudyLog,
    logout,
  } = useUserStore()
  const clearSelectedCourse = useCourseStore((s) => s.clearSelectedCourse)
  const [isFocusing, setIsFocusing] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    clearSelectedCourse()
  }, [clearSelectedCourse])

  useEffect(() => {
    if (userId == null) return
    void Promise.all([fetchUser(), fetchWeeklyProgress(), fetchStudyLogs()])
  }, [userId, fetchUser, fetchWeeklyProgress, fetchStudyLogs])

  useEffect(() => {
    if (!isFocusing || !startedAt) return
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [isFocusing, startedAt])

  const displayUser = user || { nickname: '비이브유저', email: 'test@vibe.com' }
  const progressValue = gaugeChartData?.[0]?.value ?? 0
  const refreshDashboard = async () => {
    await Promise.all([fetchUser(), fetchWeeklyProgress(), fetchStudyLogs()])
  }

  const weekly7DaysData = useMemo(() => {
    const source = weeklyProgress?.dailyProgress || []
    const map = new Map(source.map((d) => [d.day, d.durationMinutes || 0]))
    return WEEK_KR.map((day) => ({ day, durationMinutes: map.get(day) ?? 0 }))
  }, [weeklyProgress])

  const focusTrendData = useMemo(
    () =>
      (studyLogs || [])
        .slice()
        .reverse()
        .map((log) => ({
          date: log.studyDate,
          focusScore: log.averageFocusScore ?? 0,
        })),
    [studyLogs],
  )

  const handleToggleFocus = async () => {
    if (!isFocusing) {
      setIsFocusing(true)
      setStartedAt(Date.now())
      setElapsedSec(0)
      return
    }

    try {
      const minutes = Math.max(1, Math.floor(elapsedSec / 60))
      await logStudySession(minutes)
      await refreshDashboard()
      alert('집중 완료! 기록이 저장되었습니다.')
    } catch {
      alert('집중 기록 저장에 실패했습니다.')
    } finally {
      setIsFocusing(false)
      setStartedAt(null)
      setElapsedSec(0)
    }
  }

  const handleDeleteLog = async (id) => {
    try {
      await deleteStudyLog(id)
      await refreshDashboard()
      alert('기록이 삭제되었습니다')
    } catch {
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return
    setIsExiting(true)
    await new Promise((r) => setTimeout(r, 220))
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className={`min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-2">
            Vibe Dashboard
          </h1>
          <h2 className="text-4xl font-extrabold text-white">주간 집중 리포트</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFocus}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition ${
              isFocusing
                ? 'bg-red-500 border border-red-400'
                : 'bg-blue-600 border border-blue-500'
            }`}
          >
            {isFocusing ? <Square size={16} /> : <Play size={16} />}
            {isFocusing
              ? `집중 종료 (${formatMinutesToKoreanTime(Math.floor(elapsedSec / 60))})`
              : '오늘의 집중 시작'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800 border border-slate-700 text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
          <div className="p-3 bg-slate-700 w-fit rounded-2xl text-blue-400 mb-4">
            <User2 size={22} />
          </div>
          <p className="text-xl font-bold text-white">
            {(displayUser.nickname || displayUser.name || '비이브유저')}님
          </p>
          <p className="text-xs text-slate-400 mt-1">{displayUser.email}</p>
        </div>

        <div className="bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition md:col-span-2">
          <h3 className="text-white font-bold mb-3">목표 달성률</h3>
          <div className="h-[220px]">
            {loading ? (
              <div className="h-full w-full rounded-2xl bg-slate-700/40 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="65%"
                  outerRadius="100%"
                  data={gaugeChartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    background={{ fill: '#334155' }}
                    dataKey="value"
                    cornerRadius={12}
                    fill={progressValue < 30 ? '#ef4444' : progressValue < 70 ? '#facc15' : '#22c55e'}
                  />
                  <text
                    x="50%"
                    y="52%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-3xl font-bold"
                  >
                    {progressValue}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
          <h3 className="text-lg font-bold text-white mb-6">목표 vs 실제</h3>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full w-full rounded-2xl bg-slate-700/40 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareChartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => formatMinutesToKoreanTime(value)}
                  />
                  <Tooltip
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    formatter={(value) => [formatMinutesToKoreanTime(value), '집중 시간']}
                  />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
          <h3 className="text-lg font-bold text-white mb-6">요일별 집중 시간</h3>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full w-full rounded-2xl bg-slate-700/40 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProgress?.dailyProgress || []}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    formatter={(value) => [formatMinutesToKoreanTime(value), '집중 시간']}
                  />
                  <Bar dataKey="durationMinutes" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="max-w-6xl mx-auto mt-8">
        <StudentMyCourseList userId={userId} />
      </div>

      <section className="max-w-6xl mx-auto mt-8 bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
        <h3 className="text-lg font-bold text-white mb-4">학습 히스토리</h3>
        {loading ? (
          <div className="space-y-2">
            <div className="h-9 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-9 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-9 rounded bg-slate-700/50 animate-pulse" />
          </div>
        ) : studyLogs.length === 0 ? (
          <p className="text-slate-400">아직 기록된 학습 로그가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="py-2">날짜</th>
                  <th className="py-2">시간(분)</th>
                  <th className="py-2 text-right">삭제</th>
                </tr>
              </thead>
              <tbody>
                {studyLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800">
                    <td className="py-3 text-white">{log.studyDate}</td>
                    <td className="py-3 text-white">{formatMinutesToKoreanTime(log.durationMinutes)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="inline-flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto mt-8 bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
        <h3 className="text-lg font-bold text-white mb-4">월~일 집중 시간</h3>
        <div className="h-[260px]">
          {loading ? (
            <div className="h-full w-full rounded-2xl bg-slate-700/40 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly7DaysData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => formatMinutesToKoreanTime(value)}
                />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  formatter={(value) => [formatMinutesToKoreanTime(value), '집중 시간']}
                />
                <Bar dataKey="durationMinutes" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-8 bg-slate-800/70 p-6 rounded-3xl border border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition">
        <h3 className="text-lg font-bold text-white mb-4">AI 몰입도 추이</h3>
        <div className="h-[260px]">
          {loading ? (
            <div className="h-full w-full rounded-2xl bg-slate-700/40 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusTrendData}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ stroke: '#475569' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  formatter={(value) => [`${value}점`, '몰입도']}
                />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard