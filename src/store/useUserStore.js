import { create } from 'zustand'
import api from '../axios'

const useUserStore = create((set, get) => ({
  userId: 1,
  user: null,
  weeklyProgress: null,
  compareChartData: [],
  gaugeChartData: [],
  studyLogs: [],
  loading: false,
  error: null,

  setUserId: (id) => set({ userId: id }),

  fetchUser: async () => {
    set({ loading: true, error: null })
    const userId = get().userId
    try {
      const res = await api.get(`/api/users/${userId}`)
      set({ user: res.data, loading: false })
    } catch (err) {
      set({ error: err, loading: false })
    }
  },

  fetchWeeklyProgress: async () => {
    set({ loading: true, error: null })
    const userId = get().userId
    try {
      const res = await api.get(`/api/users/${userId}/weekly-progress`)
      const raw = res.data
      const goalMinutes = raw?.goalMinutes ?? raw?.weeklyGoalMinutes ?? 1000
      const totalMinutes =
        raw?.actualMinutes ??
        raw?.totalMinutes ??
        (raw?.dailyProgress || raw?.dailyMinutes || []).reduce(
          (acc, cur) =>
            acc + (cur.durationMinutes ?? cur.minutes ?? 0),
          0,
        )

      const daily = raw?.dailyProgress || raw?.dailyMinutes || []
      const normalizedDaily = daily.map((item) => ({
        day: item.day,
        durationMinutes: item.durationMinutes ?? item.minutes ?? 0,
      }))

      const achievementRate =
        raw?.achievementRate ??
        goalMinutes > 0
          ? Math.min(100, Math.round((totalMinutes / goalMinutes) * 100))
          : 0

      set({
        user: get().user
          ? { ...get().user, nickname: raw?.nickname ?? get().user.nickname }
          : raw?.nickname
            ? { nickname: raw.nickname, name: raw.nickname, email: raw?.email ?? '' }
            : get().user,
        weeklyProgress: {
          goalMinutes,
          totalMinutes: raw?.actualMinutes ?? totalMinutes,
          actualMinutes: raw?.actualMinutes ?? totalMinutes,
          dailyProgress: normalizedDaily,
          achievementRate,
        },
        compareChartData: [
          { name: '목표', minutes: goalMinutes },
          { name: '실제', minutes: totalMinutes },
        ],
        gaugeChartData: [{ name: '달성률', value: achievementRate }],
        loading: false,
      })
    } catch (err) {
      set({ error: err, loading: false })
    }
  },

  fetchStudyLogs: async () => {
    set({ loading: true, error: null })
    const userId = get().userId
    try {
      const res = await api.get(`/api/study-logs/user/${userId}`)
      set({ studyLogs: res.data, loading: false })
    } catch (err) {
      set({ error: err, loading: false })
    }
  },

  logStudySession: async (minutes) => {
    try {
      const userId = get().userId
      const today = new Date().toISOString().slice(0, 10)
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - minutes * 60000)

      await api.post('/api/study-logs', {
        userId: userId,
        durationMinutes: minutes,
        studyDate: today,
        meetingTitle: '오늘의 집중 학습',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      })
    } catch (err) {
      set({ error: err })
      throw err
    }
  },

  deleteStudyLog: async (id) => {
    try {
      await api.delete(`/api/study-logs/${id}`)
      const current = get().studyLogs || []
      set({ studyLogs: current.filter((log) => log.id !== id) })
    } catch (err) {
      set({ error: err })
      throw err
    }
  },

  logout: async () => {
    try {
      await api.post('/api/logout')
    } catch (err) {
      set({ error: err })
    } finally {
      set({ user: null, weeklyProgress: null, studyLogs: [] })
    }
  },
}))

export default useUserStore

