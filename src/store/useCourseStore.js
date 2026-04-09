import { create } from 'zustand'

const useCourseStore = create((set) => ({
  selectedCourse: null,
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  clearSelectedCourse: () => set({ selectedCourse: null }),
}))

export default useCourseStore

