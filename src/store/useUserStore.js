import { create } from 'zustand'
import api from '../axios'
import {
  VIBEFRONT_ADMIN_TOKEN_KEY,
  VIBEFRONT_AUTH_FLAG_KEY,
  VIBEFRONT_USER_ID_KEY,
} from '../constants/storageKeys'

function readAuthFlag() {
  try {
    return localStorage.getItem(VIBEFRONT_AUTH_FLAG_KEY) === 'true'
  } catch {
    return false
  }
}

function readStoredUserId() {
  try {
    const v = localStorage.getItem(VIBEFRONT_USER_ID_KEY)
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** 로컬에 세션만 있고 user 객체는 아직 없을 때(새로고침 직후) 라우트가 리다이렉트 루프에 빠지지 않게 함 */
function initialSessionResolved() {
  if (typeof window === 'undefined') return true
  if (!readAuthFlag()) return true
  if (readStoredUserId() == null) return true
  return false
}

const useUserStore = create((set, get) => ({
  userId: typeof window !== 'undefined' ? readStoredUserId() : null,
  user: null,
  weeklyProgress: null,
  compareChartData: [],
  gaugeChartData: [],
  studyLogs: [],
  loading: false,
  error: null,
  /** 로컬 플래그 기반 인증(보호 라우트용). 실제 서비스에서는 토큰·세션과 연동하세요. */
  isAuthenticated: typeof window !== 'undefined' ? readAuthFlag() : false,
  /** false인 동안은 역할 기반 Navigate 금지(프로필 복원 대기) */
  sessionResolved: initialSessionResolved(),

  setUserId: (id) => set({ userId: id }),

  /** 로그인: /api/login 호출 후 로컬 인증 상태를 저장합니다. */
  login: async (credentials = {}) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/api/login', credentials)
      const loggedIn = res.data
      try {
        localStorage.setItem(VIBEFRONT_AUTH_FLAG_KEY, 'true')
        localStorage.setItem(VIBEFRONT_USER_ID_KEY, String(loggedIn.id))
        localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      set({
        isAuthenticated: true,
        userId: loggedIn.id,
        user: loggedIn,
        loading: false,
        sessionResolved: true,
      })
      return loggedIn
    } catch (err) {
      set({ loading: false, error: err, isAuthenticated: false, user: null, sessionResolved: true })
      try {
        localStorage.removeItem(VIBEFRONT_AUTH_FLAG_KEY)
        localStorage.removeItem(VIBEFRONT_USER_ID_KEY)
        localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      throw err
    }
  },

  /** 운영자 전용 로그인: /api/admin/auth/login */
  adminLogin: async ({ email, password }) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/api/admin/auth/login', { email, password })
      const loggedIn = res.data
      const resolvedId = loggedIn?.id ?? loggedIn?.userId ?? null
      try {
        localStorage.setItem(VIBEFRONT_AUTH_FLAG_KEY, 'true')
        if (resolvedId != null) {
          localStorage.setItem(VIBEFRONT_USER_ID_KEY, String(resolvedId))
        }
        if (loggedIn?.token) {
          localStorage.setItem(VIBEFRONT_ADMIN_TOKEN_KEY, String(loggedIn.token))
        } else {
          localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
        }
      } catch {
        /* ignore */
      }
      set({
        isAuthenticated: true,
        userId: resolvedId,
        user: {
          ...loggedIn,
          id: resolvedId,
          role: loggedIn?.role || 'ADMIN',
        },
        loading: false,
        sessionResolved: true,
      })
      return loggedIn
    } catch (err) {
      set({ loading: false, error: err, isAuthenticated: false, user: null, sessionResolved: true })
      try {
        localStorage.removeItem(VIBEFRONT_AUTH_FLAG_KEY)
        localStorage.removeItem(VIBEFRONT_USER_ID_KEY)
        localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      throw err
    }
  },

  fetchUser: async () => {
    set({ loading: true, error: null })
    const userId = get().userId
    if (userId == null) {
      set({ loading: false })
      return false
    }
    try {
      const res = await api.get(`/api/users/${userId}`)
      set({ user: res.data, loading: false })
      return true
    } catch (err) {
      set({ error: err, loading: false })
      return false
    }
  },

  fetchWeeklyProgress: async () => {
    set({ loading: true, error: null })
    const userId = get().userId
    if (userId == null) {
      set({ loading: false })
      return
    }
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
    if (userId == null) {
      set({ loading: false })
      return
    }
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
      if (userId == null) throw new Error('로그인이 필요합니다.')
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
      try {
        localStorage.removeItem(VIBEFRONT_AUTH_FLAG_KEY)
        localStorage.removeItem(VIBEFRONT_USER_ID_KEY)
        localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      set({
        user: null,
        userId: null,
        weeklyProgress: null,
        studyLogs: [],
        compareChartData: [],
        gaugeChartData: [],
        isAuthenticated: false,
        sessionResolved: true,
      })
    }
  },
}))

export default useUserStore

