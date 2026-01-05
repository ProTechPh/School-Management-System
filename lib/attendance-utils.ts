import type { AttendanceStatus } from "@/lib/types"

export interface AttendanceStats {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number
}

/**
 * Calculate attendance statistics from a list of attendance records
 * @param records - Array of attendance records with status field
 * @returns Statistics object with counts and attendance rate percentage
 */
export function calculateAttendanceStats(
  records: Array<{ status: AttendanceStatus }>
): AttendanceStats {
  const stats = records.reduce(
    (acc, record) => {
      // Only count valid status values
      if (record.status in acc) {
        acc[record.status]++
      }
      acc.total++
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
  )

  // Calculate attendance rate (present + late counts as attended)
  const attendanceRate = stats.total > 0 
    ? Math.round(((stats.present + stats.late) / stats.total) * 100) 
    : 0

  return {
    ...stats,
    rate: attendanceRate
  }
}
