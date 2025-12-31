import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Department {
  id: string
  name: string
  description?: string
}

interface DepartmentStore {
  departments: Department[]
  addDepartment: (name: string, description?: string) => void
  updateDepartment: (id: string, name: string, description?: string) => void
  deleteDepartment: (id: string) => void
}

const defaultDepartments: Department[] = [
  { id: "1", name: "Mathematics", description: "Math and Statistics" },
  { id: "2", name: "Science", description: "Physics, Chemistry, Biology" },
  { id: "3", name: "English", description: "English Language and Literature" },
  { id: "4", name: "Filipino", description: "Filipino Language and Literature" },
  { id: "5", name: "Social Studies", description: "History, Geography, Economics" },
  { id: "6", name: "TLE", description: "Technology and Livelihood Education" },
  { id: "7", name: "MAPEH", description: "Music, Arts, PE, Health" },
  { id: "8", name: "Values Education", description: "Values and Character Education" },
]

export const useDepartmentStore = create<DepartmentStore>()(
  persist(
    (set) => ({
      departments: defaultDepartments,
      
      addDepartment: (name, description) =>
        set((state) => ({
          departments: [
            ...state.departments,
            {
              id: Date.now().toString(),
              name,
              description,
            },
          ],
        })),
      
      updateDepartment: (id, name, description) =>
        set((state) => ({
          departments: state.departments.map((dept) =>
            dept.id === id ? { ...dept, name, description } : dept
          ),
        })),
      
      deleteDepartment: (id) =>
        set((state) => ({
          departments: state.departments.filter((dept) => dept.id !== id),
        })),
    }),
    {
      name: "department-store",
    }
  )
)
