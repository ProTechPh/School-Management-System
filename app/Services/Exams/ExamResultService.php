<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamResult;
use App\Models\GradingScaleItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class ExamResultService
{
    public function getExamResults(array $filters = []): LengthAwarePaginator
    {
        $query = ExamResult::with([
            'student.user',
            'examTerm',
            'examAssessment',
            'subject',
            'enteredBy.user'
        ]);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['exam_term_id'])) {
            $query->where('exam_term_id', $filters['exam_term_id']);
        }

        if (isset($filters['exam_assessment_id'])) {
            $query->where('exam_assessment_id', $filters['exam_assessment_id']);
        }

        if (isset($filters['subject_id'])) {
            $query->where('subject_id', $filters['subject_id']);
        }

        if (isset($filters['classroom_id'])) {
            $query->whereHas('examAssessment', function ($q) use ($filters) {
                $q->where('classroom_id', $filters['classroom_id']);
            });
        }

        if (isset($filters['section_id'])) {
            $query->whereHas('examAssessment', function ($q) use ($filters) {
                $q->where('section_id', $filters['section_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function createExamResult(array $data): ExamResult
    {
        return DB::transaction(function () use ($data) {
            // Check if result already exists for this student/assessment
            $existing = ExamResult::where('student_id', $data['student_id'])
                ->where('exam_assessment_id', $data['exam_assessment_id'])
                ->first();

            if ($existing) {
                throw new \Exception('Exam result already exists for this student and assessment');
            }

            // Calculate grade and grade points if not provided
            if (!isset($data['grade']) || !isset($data['grade_points'])) {
                $grading = $this->calculateGradeAndPoints(
                    $data['marks_obtained'],
                    $data['exam_assessment_id']
                );
                $data['grade'] = $grading['grade'];
                $data['grade_points'] = $grading['grade_points'];
            }

            // Determine if passed
            $assessment = \App\Models\ExamAssessment::find($data['exam_assessment_id']);
            $data['is_passed'] = $data['marks_obtained'] >= $assessment->passing_marks;

            return ExamResult::create($data);
        });
    }

    public function updateExamResult(ExamResult $examResult, array $data): ExamResult
    {
        return DB::transaction(function () use ($examResult, $data) {
            // Recalculate grade and grade points if marks changed
            if (isset($data['marks_obtained']) && $data['marks_obtained'] != $examResult->marks_obtained) {
                $grading = $this->calculateGradeAndPoints(
                    $data['marks_obtained'],
                    $examResult->exam_assessment_id
                );
                $data['grade'] = $grading['grade'];
                $data['grade_points'] = $grading['grade_points'];

                // Update pass status
                $assessment = \App\Models\ExamAssessment::find($examResult->exam_assessment_id);
                $data['is_passed'] = $data['marks_obtained'] >= $assessment->passing_marks;
            }

            $examResult->update($data);
            return $examResult->fresh();
        });
    }

    public function bulkCreateExamResults(array $resultsData): array
    {
        return DB::transaction(function () use ($resultsData) {
            $results = [];
            
            foreach ($resultsData as $data) {
                $results[] = $this->createExamResult($data);
            }
            
            return $results;
        });
    }

    public function getStudentReportCard(int $studentId, int $examTermId): array
    {
        $results = ExamResult::with(['examAssessment', 'subject'])
            ->where('student_id', $studentId)
            ->where('exam_term_id', $examTermId)
            ->get();

        $subjects = $results->groupBy('subject_id');
        $reportCard = [];

        foreach ($subjects as $subjectId => $subjectResults) {
            $subject = $subjectResults->first()->subject;
            $totalMarks = 0;
            $totalObtained = 0;
            $totalGradePoints = 0;
            $assessmentCount = 0;

            foreach ($subjectResults as $result) {
                $totalMarks += $result->examAssessment->max_marks;
                $totalObtained += $result->marks_obtained;
                $totalGradePoints += $result->grade_points;
                $assessmentCount++;
            }

            $percentage = $totalMarks > 0 ? round(($totalObtained / $totalMarks) * 100, 2) : 0;
            $averageGradePoints = $assessmentCount > 0 ? round($totalGradePoints / $assessmentCount, 2) : 0;

            $reportCard[] = [
                'subject' => $subject,
                'total_marks' => $totalMarks,
                'total_obtained' => $totalObtained,
                'percentage' => $percentage,
                'average_grade_points' => $averageGradePoints,
                'assessments' => $subjectResults->map(function ($result) {
                    return [
                        'assessment_name' => $result->examAssessment->name,
                        'assessment_type' => $result->examAssessment->assessment_type,
                        'max_marks' => $result->examAssessment->max_marks,
                        'marks_obtained' => $result->marks_obtained,
                        'grade' => $result->grade,
                        'grade_points' => $result->grade_points,
                        'is_passed' => $result->is_passed,
                    ];
                }),
            ];
        }

        return $reportCard;
    }

    public function getClassResults(int $examAssessmentId): array
    {
        $assessment = \App\Models\ExamAssessment::with(['classroom', 'section', 'subject'])->find($examAssessmentId);
        $results = ExamResult::with(['student.user'])
            ->where('exam_assessment_id', $examAssessmentId)
            ->get();

        $statistics = [
            'total_students' => $results->count(),
            'passed' => $results->where('is_passed', true)->count(),
            'failed' => $results->where('is_passed', false)->count(),
            'average_marks' => $results->avg('marks_obtained'),
            'highest_marks' => $results->max('marks_obtained'),
            'lowest_marks' => $results->min('marks_obtained'),
        ];

        return [
            'assessment' => $assessment,
            'results' => $results,
            'statistics' => $statistics,
        ];
    }

    private function calculateGradeAndPoints(float $marks, int $assessmentId): array
    {
        $assessment = \App\Models\ExamAssessment::find($assessmentId);
        $maxMarks = $assessment->max_marks;
        $percentage = ($marks / $maxMarks) * 100;

        // Get the current academic year's grading scale
        $academicYearId = $assessment->examTerm->academic_year_id;
        $gradingScale = \App\Models\GradingScale::where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->first();

        if (!$gradingScale) {
            // Default grading if no scale is defined
            return $this->getDefaultGrade($percentage);
        }

        $gradeItem = GradingScaleItem::where('grading_scale_id', $gradingScale->id)
            ->where('min_marks', '<=', $percentage)
            ->where('max_marks', '>=', $percentage)
            ->first();

        if ($gradeItem) {
            return [
                'grade' => $gradeItem->grade,
                'grade_points' => $gradeItem->grade_points,
            ];
        }

        return $this->getDefaultGrade($percentage);
    }

    private function getDefaultGrade(float $percentage): array
    {
        if ($percentage >= 90) {
            return ['grade' => 'A+', 'grade_points' => 4.0];
        } elseif ($percentage >= 80) {
            return ['grade' => 'A', 'grade_points' => 3.5];
        } elseif ($percentage >= 70) {
            return ['grade' => 'B+', 'grade_points' => 3.0];
        } elseif ($percentage >= 60) {
            return ['grade' => 'B', 'grade_points' => 2.5];
        } elseif ($percentage >= 50) {
            return ['grade' => 'C+', 'grade_points' => 2.0];
        } elseif ($percentage >= 40) {
            return ['grade' => 'C', 'grade_points' => 1.5];
        } else {
            return ['grade' => 'F', 'grade_points' => 0.0];
        }
    }

    public function deleteExamResult(ExamResult $examResult): void
    {
        $examResult->delete();
    }
}
