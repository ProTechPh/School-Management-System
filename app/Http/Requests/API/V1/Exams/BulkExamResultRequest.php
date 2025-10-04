<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Exams;

use Illuminate\Foundation\Http\FormRequest;

final class BulkExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'results' => 'required|array|min:1',
            'results.*.student_id' => 'required|exists:students,id',
            'results.*.exam_term_id' => 'required|exists:exam_terms,id',
            'results.*.exam_assessment_id' => 'required|exists:exam_assessments,id',
            'results.*.subject_id' => 'required|exists:subjects,id',
            'results.*.marks_obtained' => 'required|numeric|min:0',
            'results.*.grade' => 'nullable|string|max:5',
            'results.*.grade_points' => 'nullable|numeric|min:0|max:4',
            'results.*.remarks' => 'nullable|string|max:500',
            'results.*.entered_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'results.required' => 'Results array is required',
            'results.array' => 'Results must be an array',
            'results.min' => 'At least one result is required',
            'results.*.student_id.required' => 'Student is required for each result',
            'results.*.student_id.exists' => 'Selected student does not exist',
            'results.*.exam_term_id.required' => 'Exam term is required for each result',
            'results.*.exam_term_id.exists' => 'Selected exam term does not exist',
            'results.*.exam_assessment_id.required' => 'Exam assessment is required for each result',
            'results.*.exam_assessment_id.exists' => 'Selected exam assessment does not exist',
            'results.*.subject_id.required' => 'Subject is required for each result',
            'results.*.subject_id.exists' => 'Selected subject does not exist',
            'results.*.marks_obtained.required' => 'Marks obtained is required for each result',
            'results.*.marks_obtained.numeric' => 'Marks obtained must be a number',
            'results.*.marks_obtained.min' => 'Marks obtained cannot be negative',
            'results.*.grade.max' => 'Grade cannot exceed 5 characters',
            'results.*.grade_points.numeric' => 'Grade points must be a number',
            'results.*.grade_points.min' => 'Grade points cannot be negative',
            'results.*.grade_points.max' => 'Grade points cannot exceed 4',
            'results.*.remarks.max' => 'Remarks cannot exceed 500 characters',
            'results.*.entered_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
