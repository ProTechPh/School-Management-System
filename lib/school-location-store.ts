import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface SchoolLocation {
  latitude: number
  longitude: number
  radiusMeters: number
  name: string
}

interface SchoolLocationState {
  location: SchoolLocation
  allowOutOfRange: boolean
  setLocation: (location: SchoolLocation) => void
  setAllowOutOfRange: (allow: boolean) => void
  isWithinRange: (userLat: number, userLng: number) => boolean
  getDistanceFromSchool: (userLat: number, userLng: number) => number
}

// Default school location (can be changed by admin)
const defaultLocation: SchoolLocation = {
  latitude: 14.5995, // Manila, Philippines
  longitude: 120.9842,
  radiusMeters: 500, // 500 meters default radius
  name: "LessonGo School Campus",
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export const useSchoolLocationStore = create<SchoolLocationState>()(
  persist(
    (set, get) => ({
      location: defaultLocation,
      allowOutOfRange: false,

      setLocation: (location) => set({ location }),

      setAllowOutOfRange: (allow) => set({ allowOutOfRange: allow }),

      isWithinRange: (userLat, userLng) => {
        const { location, allowOutOfRange } = get()
        if (allowOutOfRange) return true
        const distance = calculateDistance(userLat, userLng, location.latitude, location.longitude)
        return distance <= location.radiusMeters
      },

      getDistanceFromSchool: (userLat, userLng) => {
        const { location } = get()
        return calculateDistance(userLat, userLng, location.latitude, location.longitude)
      },
    }),
    {
      name: "school-location-storage",
    }
  )
)
