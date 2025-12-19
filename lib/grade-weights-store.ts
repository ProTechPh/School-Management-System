import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface GradeWeight {
  type: "quiz" | "exam" | "assignment" | "project"
  weight: number
  label: string
}

export const defaultGradeWeights: GradeWeight[] = [
  { type: "quiz", weight: 30, label: "Quiz" },
  { type: "exam", weight: 35, label: "Exam" },
  { type: "assignment", weight: 20, label: "Assignment" },
  { type: "project", weight: 15, label: "Project" },
]

interface GradeWeightsState {
  weights: Record<string, GradeWeight[]> // keyed by classId
  getWeightsForClass: (classId: string) => GradeWeight[]
  setWeightsForClass: (classId: string, weights: GradeWeight[]) => void
  resetWeightsForClass: (classId: string) => void
}

export const useGradeWeightsStore = create<GradeWeightsState>()(
  persist(
    (set, get) => ({
      weights: {},
      getWeightsForClass: (classId: string) => {
        return get().weights[classId] || defaultGradeWeights
      },
      setWeightsForClass: (classId: string, weights: GradeWeight[]) => {
        set((state) => ({
          weights: {
            ...state.weights,
            [classId]: weights,
          },
        }))
      },
      resetWeightsForClass: (classId: string) => {
        set((state) => {
          const newWeights = { ...state.weights }
          delete newWeights[classId]
          return { weights: newWeights }
        })
      },
    }),
    {
      name: "grade-weights-storage",
    }
  )
)
