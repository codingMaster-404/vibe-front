import { create } from 'zustand'
import api from '../axios'

const useStudyStore = create((set, get) => ({
  userId: 1,
  isStudying: false,
  sessionStart: null,
  elapsedSeconds: 0,
  sessionAverageFocusScore: 0,
  sessionTitle: '오늘의 집중 학습',
  saving: false,
  error: null,

  setUserId: (userId) => set({ userId }),

  startSession: ({ meetingTitle } = {}) => {
    set({
      isStudying: true,
      sessionStart: Date.now(),
      elapsedSeconds: 0,
      sessionAverageFocusScore: 0,
      sessionTitle: meetingTitle || '오늘의 집중 학습',
      error: null,
    })
  },

  tickSession: () => {
    const { isStudying, sessionStart } = get()
    if (!isStudying || !sessionStart) return
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000))
    set({ elapsedSeconds })
  },

  setSessionAverageFocusScore: (score) => {
    const value = Math.max(0, Math.min(100, Math.round(score || 0)))
    set({ sessionAverageFocusScore: value })
  },

  stopAndSaveSession: async () => {
    const {
      isStudying,
      sessionStart,
      userId,
      sessionTitle,
      sessionAverageFocusScore,
    } = get()
    if (!isStudying || !sessionStart) return null

    const endDate = new Date()
    const startDate = new Date(sessionStart)
    const durationMinutes = Math.max(
      1,
      Math.floor((endDate.getTime() - startDate.getTime()) / 60000),
    )

    set({ saving: true, error: null })
    try {
      const payload = {
        userId,
        meetingTitle: sessionTitle,
        studyDate: endDate.toISOString().slice(0, 10),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        durationMinutes,
        averageFocusScore: sessionAverageFocusScore,
      }

      const res = await api.post('/api/study-logs', payload)
      set({
        isStudying: false,
        sessionStart: null,
        elapsedSeconds: 0,
        saving: false,
      })
      return res.data
    } catch (err) {
      set({ saving: false, error: err })
      throw err
    }
  },

  resetSession: () => {
    set({
      isStudying: false,
      sessionStart: null,
      elapsedSeconds: 0,
      sessionAverageFocusScore: 0,
      saving: false,
      error: null,
    })
  },
}))

export default useStudyStore
