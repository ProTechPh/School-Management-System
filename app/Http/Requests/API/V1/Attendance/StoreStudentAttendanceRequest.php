<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreStudentAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\StudentAttendance::class);
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'classroom_id' => ['required', 'exists:classrooms,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'attendance_date' => ['required', 'date'],
            'status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
            'period' => ['nullable', 'string', 'max:50'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'marked_by' => ['nullable', 'exists:staff,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'Student is required',
            'student_id.exists' => 'Selected student does not exist',
            'academic_year_id.required' => 'Academic year is required',
            'academic_year_id.exists' => 'Selected academic year does not exist',
            'classroom_id.required' => 'Classroom is required',
            'classroom_id.exists' => 'Selected classroom does not exist',
            'section_id.required' => 'Section is required',
            'section_id.exists' => 'Selected section does not exist',
            'attendance_date.required' => 'Attendance date is required',
            'attendance_date.date' => 'Please provide a valid date',
            'status.required' => 'Attendance status is required',
            'status.in' => 'Invalid attendance status',
            'subject_id.exists' => 'Selected subject does not exist',
            'marked_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
