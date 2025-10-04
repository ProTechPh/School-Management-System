<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Exams;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'exam_term_id' => 'required|exists:exam_terms,id',
            'exam_assessment_id' => 'required|exists:exam_assessments,id',
            'subject_id' => 'required|exists:subjects,id',
            'marks_obtained' => 'required|numeric|min:0',
            'grade' => 'nullable|string|max:5',
            'grade_points' => 'nullable|numeric|min:0|max:4',
            'remarks' => 'nullable|string|max:500',
            'entered_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'Student is required',
            'student_id.exists' => 'Selected student does not exist',
            'exam_term_id.required' => 'Exam term is required',
            'exam_term_id.exists' => 'Selected exam term does not exist',
            'exam_assessment_id.required' => 'Exam assessment is required',
            'exam_assessment_id.exists' => 'Selected exam assessment does not exist',
            'subject_id.required' => 'Subject is required',
            'subject_id.exists' => 'Selected subject does not exist',
            'marks_obtained.required' => 'Marks obtained is required',
            'marks_obtained.numeric' => 'Marks obtained must be a number',
            'marks_obtained.min' => 'Marks obtained cannot be negative',
            'grade.max' => 'Grade cannot exceed 5 characters',
            'grade_points.numeric' => 'Grade points must be a number',
            'grade_points.min' => 'Grade points cannot be negative',
            'grade_points.max' => 'Grade points cannot exceed 4',
            'remarks.max' => 'Remarks cannot exceed 500 characters',
            'entered_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
