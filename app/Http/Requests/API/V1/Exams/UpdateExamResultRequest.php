<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Exams;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'marks_obtained' => 'sometimes|numeric|min:0',
            'grade' => 'nullable|string|max:5',
            'grade_points' => 'nullable|numeric|min:0|max:4',
            'remarks' => 'nullable|string|max:500',
            'entered_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
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
