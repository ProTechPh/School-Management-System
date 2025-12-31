// Philippine Grading System Utilities
// Grade Scale: 75-100 (Passing is 75)
// 96-100 = Excellent
// 90-95 = Outstanding
// 85-89 = Very Satisfactory
// 80-84 = Satisfactory
// 75-79 = Fairly Satisfactory
// Below 75 = Did Not Meet Expectations

export interface GradeInfo {
  numericGrade: number
  remarks: string
  status: "excellent" | "outstanding" | "very-satisfactory" | "satisfactory" | "fairly-satisfactory" | "failed"
}

// Convert percentage (0-100) to Philippine grade (75-100 or below)
export function percentageToPhGrade(percentage: number): number {
  if (percentage >= 100) return 100
  if (percentage >= 98) return 99
  if (percentage >= 95) return 98
  if (percentage >= 92) return 97
  if (percentage >= 90) return 96
  if (percentage >= 87) return 94
  if (percentage >= 85) return 92
  if (percentage >= 82) return 90
  if (percentage >= 80) return 88
  if (percentage >= 77) return 85
  if (percentage >= 75) return 82
  if (percentage >= 72) return 79
  if (percentage >= 70) return 77
  if (percentage >= 65) return 75
  if (percentage >= 60) return 73
  if (percentage >= 55) return 71
  if (percentage >= 50) return 70
  if (percentage >= 40) return 68
  if (percentage >= 30) return 65
  return 60
}

// Get grade info including remarks
export function getGradeInfo(numericGrade: number): GradeInfo {
  if (numericGrade >= 96) {
    return { numericGrade, remarks: "Excellent", status: "excellent" }
  }
  if (numericGrade >= 90) {
    return { numericGrade, remarks: "Outstanding", status: "outstanding" }
  }
  if (numericGrade >= 85) {
    return { numericGrade, remarks: "Very Satisfactory", status: "very-satisfactory" }
  }
  if (numericGrade >= 80) {
    return { numericGrade, remarks: "Satisfactory", status: "satisfactory" }
  }
  if (numericGrade >= 75) {
    return { numericGrade, remarks: "Fairly Satisfactory", status: "fairly-satisfactory" }
  }
  return { numericGrade, remarks: "Did Not Meet Expectations", status: "failed" }
}

// Get color variant based on grade status
export function getGradeColorVariant(status: GradeInfo["status"]): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "excellent":
    case "outstanding":
      return "default"
    case "very-satisfactory":
    case "satisfactory":
      return "secondary"
    case "fairly-satisfactory":
      return "outline"
    case "failed":
      return "destructive"
  }
}

// Get background color class based on grade
export function getGradeBgClass(numericGrade: number): string {
  if (numericGrade >= 90) return "bg-primary/20 text-primary"
  if (numericGrade >= 85) return "bg-blue-500/20 text-blue-400"
  if (numericGrade >= 80) return "bg-green-500/20 text-green-400"
  if (numericGrade >= 75) return "bg-yellow-500/20 text-yellow-400"
  return "bg-destructive/20 text-destructive"
}

// Calculate final grade from multiple assessments with weights
export interface AssessmentWeight {
  type: "quiz" | "exam" | "assignment" | "project"
  weight: number // percentage (0-100)
}

export const defaultWeights: AssessmentWeight[] = [
  { type: "quiz", weight: 30 },
  { type: "exam", weight: 35 },
  { type: "assignment", weight: 20 },
  { type: "project", weight: 15 },
]

export function calculateFinalGrade(
  assessments: { type: string; percentage: number }[],
  weights: AssessmentWeight[] = defaultWeights,
): number {
  const typeAverages: Record<string, { total: number; count: number }> = {}

  // Calculate average for each type
  assessments.forEach((a) => {
    if (!typeAverages[a.type]) {
      typeAverages[a.type] = { total: 0, count: 0 }
    }
    typeAverages[a.type].total += a.percentage
    typeAverages[a.type].count++
  })

  let totalWeight = 0
  let weightedSum = 0

  weights.forEach((w) => {
    const typeAvg = typeAverages[w.type]
    if (typeAvg && typeAvg.count > 0) {
      const avg = typeAvg.total / typeAvg.count
      weightedSum += avg * (w.weight / 100)
      totalWeight += w.weight
    }
  })

  // If no assessments, return 0
  if (totalWeight === 0) return 0

  // Normalize if not all types have assessments
  const normalizedPercentage = (weightedSum / totalWeight) * 100

  return percentageToPhGrade(normalizedPercentage)
}

// Get grade status and color based on grade
export function getGradeStatus(numericGrade: number): { status: string; color: string } {
  if (numericGrade >= 96) {
    return { status: "Excellent", color: "text-primary" }
  }
  if (numericGrade >= 90) {
    return { status: "Outstanding", color: "text-blue-400" }
  }
  if (numericGrade >= 85) {
    return { status: "Very Satisfactory", color: "text-green-400" }
  }
  if (numericGrade >= 80) {
    return { status: "Satisfactory", color: "text-emerald-400" }
  }
  if (numericGrade >= 75) {
    return { status: "Fairly Satisfactory", color: "text-yellow-400" }
  }
  return { status: "Did Not Meet Expectations", color: "text-destructive" }
}

// Get grade remarks as string based on numeric grade
export function getGradeRemarks(numericGrade: number): string {
  if (numericGrade >= 96) return "Excellent"
  if (numericGrade >= 90) return "Outstanding"
  if (numericGrade >= 85) return "Very Satisfactory"
  if (numericGrade >= 80) return "Satisfactory"
  if (numericGrade >= 75) return "Fairly Satisfactory"
  return "Did Not Meet Expectations"
}
