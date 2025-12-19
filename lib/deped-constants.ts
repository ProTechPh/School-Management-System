/**
 * DepEd (Department of Education) Philippines Constants
 * 
 * This file contains all dropdown options and constants required for
 * DepEd-compliant student profile management.
 * 
 * Requirements: 4.4, 4.7, 6.1
 */

import type { 
  EnrollmentStatus, 
  SHSTrack, 
  DisabilityType 
} from "@/lib/supabase/types"

/**
 * Philippine Regions
 * Standard administrative regions of the Philippines
 */
export const PHILIPPINE_REGIONS = [
  "NCR",
  "CAR",
  "Region I",
  "Region II",
  "Region III",
  "Region IV-A",
  "Region IV-B",
  "Region V",
  "Region VI",
  "Region VII",
  "Region VIII",
  "Region IX",
  "Region X",
  "Region XI",
  "Region XII",
  "BARMM",
  "CARAGA"
] as const

export type PhilippineRegion = typeof PHILIPPINE_REGIONS[number]

/**
 * Enrollment Status Options
 * As per DepEd Learner Information System (LIS)
 * Requirements: 4.4
 */
export const ENROLLMENT_STATUS_OPTIONS: EnrollmentStatus[] = [
  "New",
  "Transferee",
  "Balik-Aral",
  "Cross-Enrollee"
]

/**
 * Enrollment Status Descriptions
 * Helpful tooltips/descriptions for each status
 */
export const ENROLLMENT_STATUS_DESCRIPTIONS: Record<EnrollmentStatus, string> = {
  "New": "First time enrollee in the school",
  "Transferee": "Transferred from another school",
  "Balik-Aral": "Returning student after dropping out",
  "Cross-Enrollee": "Enrolled in multiple schools"
}

/**
 * Senior High School (SHS) Tracks
 * Requirements: 4.7
 */
export const SHS_TRACKS: SHSTrack[] = [
  "Academic",
  "TVL",
  "Sports",
  "Arts and Design"
]

/**
 * SHS Track Full Names
 */
export const SHS_TRACK_FULL_NAMES: Record<SHSTrack, string> = {
  "Academic": "Academic Track",
  "TVL": "Technical-Vocational-Livelihood Track",
  "Sports": "Sports Track",
  "Arts and Design": "Arts and Design Track"
}

/**
 * Academic Strands per Track
 * Requirements: 4.7
 */
export const ACADEMIC_STRANDS: Record<SHSTrack, string[]> = {
  "Academic": ["ABM", "HUMSS", "STEM", "GAS"],
  "TVL": ["Agri-Fishery Arts", "Home Economics", "ICT", "Industrial Arts"],
  "Sports": ["Sports"],
  "Arts and Design": ["Arts and Design"]
}

/**
 * Strand Full Names
 */
export const STRAND_FULL_NAMES: Record<string, string> = {
  "ABM": "Accountancy, Business and Management",
  "HUMSS": "Humanities and Social Sciences",
  "STEM": "Science, Technology, Engineering and Mathematics",
  "GAS": "General Academic Strand",
  "ICT": "Information and Communications Technology"
}

/**
 * Disability Types
 * As per DepEd Special Education (SPED) classifications
 * Requirements: 6.1
 */
export const DISABILITY_TYPES: DisabilityType[] = [
  "None",
  "Visual Impairment",
  "Hearing Impairment",
  "Learning Disability",
  "Intellectual Disability",
  "Physical Disability",
  "Speech/Language Disorder",
  "Autism Spectrum Disorder",
  "Multiple Disabilities",
  "Others"
]

/**
 * Blood Types
 * Standard ABO blood group system with Rh factor
 */
export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-"
] as const

export type BloodType = typeof BLOOD_TYPES[number]

/**
 * Grade Levels
 * Junior High School (7-10) and Senior High School (11-12)
 */
export const GRADE_LEVELS = ["7", "8", "9", "10", "11", "12"] as const

export type GradeLevel = typeof GRADE_LEVELS[number]

/**
 * Junior High School Grade Levels (Grades 7-10)
 */
export const JUNIOR_HIGH_GRADES: GradeLevel[] = ["7", "8", "9", "10"]

/**
 * Senior High School Grade Levels (Grades 11-12)
 */
export const SENIOR_HIGH_GRADES: GradeLevel[] = ["11", "12"]

/**
 * Default Sections
 */
export const SECTIONS = ["A", "B", "C", "D", "E"] as const

export type Section = typeof SECTIONS[number]

/**
 * Sex Options
 */
export const SEX_OPTIONS = ["Male", "Female"] as const

/**
 * Common Mother Tongues in the Philippines
 */
export const COMMON_MOTHER_TONGUES = [
  "Tagalog",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Waray",
  "Kapampangan",
  "Bikol",
  "Pangasinan",
  "Maranao",
  "Tausug",
  "Maguindanaon",
  "Chavacano",
  "Others"
] as const

/**
 * Common Religions in the Philippines
 */
export const COMMON_RELIGIONS = [
  "Roman Catholic",
  "Islam",
  "Iglesia ni Cristo",
  "Evangelical",
  "Aglipayan",
  "Seventh-day Adventist",
  "Bible Baptist",
  "United Church of Christ",
  "Jehovah's Witness",
  "Buddhism",
  "Others",
  "None"
] as const

/**
 * Guardian Relationship Options
 */
export const GUARDIAN_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Grandparent",
  "Aunt",
  "Uncle",
  "Sibling",
  "Legal Guardian",
  "Others"
] as const

/**
 * Helper function to check if a grade is Senior High School
 */
export function isSeniorHighSchool(grade: string): boolean {
  return grade === "11" || grade === "12"
}

/**
 * Helper function to get strands for a given track
 */
export function getStrandsForTrack(track: SHSTrack | null): string[] {
  if (!track) return []
  return ACADEMIC_STRANDS[track] || []
}

/**
 * Helper function to get the current school year string
 * Format: "YYYY-YYYY" (e.g., "2024-2025")
 */
export function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 0-indexed
  
  // School year typically starts in June
  // If current month is June or later, school year is current-next
  // Otherwise, school year is previous-current
  if (month >= 6) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}
