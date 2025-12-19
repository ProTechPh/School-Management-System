import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface GradeHistory {
  id: string
  studentId: string
  studentName: string
  schoolYear: string
  gradeLevel: string
  subjects: {
    subject: string
    finalGrade: number
    remarks: string
  }[]
  generalAverage: number
  remarks: string
  promotedDate: string
}

interface GradeHistoryStore {
  gradeHistory: GradeHistory[]
  addGradeHistory: (history: Omit<GradeHistory, "id">) => void
  getStudentHistory: (studentId: string) => GradeHistory[]
}

export const useGradeHistoryStore = create<GradeHistoryStore>()(
  persist(
    (set, get) => ({
      gradeHistory: [],
      addGradeHistory: (history) => {
        const newHistory: GradeHistory = {
          ...history,
          id: `gh${Date.now()}`,
        }
        set((state) => ({
          gradeHistory: [...state.gradeHistory, newHistory],
        }))
      },
      getStudentHistory: (studentId) => {
        return get().gradeHistory.filter((h) => h.studentId === studentId)
      },
    }),
    {
      name: "grade-history-storage",
    },
  ),
)
