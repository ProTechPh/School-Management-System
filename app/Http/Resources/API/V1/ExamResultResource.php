<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ExamResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->student ? new UserResource($this->student->user) : null,
            'exam_term' => new AcademicYearResource($this->whenLoaded('examTerm')),
            'exam_assessment' => [
                'id' => $this->examAssessment->id ?? null,
                'name' => $this->examAssessment->name ?? null,
                'assessment_type' => $this->examAssessment->assessment_type ?? null,
                'max_marks' => $this->examAssessment->max_marks ?? null,
                'passing_marks' => $this->examAssessment->passing_marks ?? null,
                'exam_date' => $this->examAssessment->exam_date ?? null,
            ],
            'subject' => new SubjectResource($this->whenLoaded('subject')),
            'marks_obtained' => $this->marks_obtained,
            'grade' => $this->grade,
            'grade_points' => $this->grade_points,
            'remarks' => $this->remarks,
            'is_passed' => $this->is_passed,
            'entered_by' => new StaffResource($this->whenLoaded('enteredBy')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
