<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class BulkStudentAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\StudentAttendance::class);
    }

    public function rules(): array
    {
        return [
            'attendance' => ['required', 'array', 'min:1'],
            'attendance.*.student_id' => ['required', 'exists:students,id'],
            'attendance.*.academic_year_id' => ['required', 'exists:academic_years,id'],
            'attendance.*.classroom_id' => ['required', 'exists:classrooms,id'],
            'attendance.*.section_id' => ['required', 'exists:sections,id'],
            'attendance.*.attendance_date' => ['required', 'date'],
            'attendance.*.status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
            'attendance.*.period' => ['nullable', 'string', 'max:50'],
            'attendance.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'attendance.*.remarks' => ['nullable', 'string', 'max:500'],
            'attendance.*.marked_by' => ['nullable', 'exists:staff,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'attendance.required' => 'Attendance data is required',
            'attendance.array' => 'Attendance data must be an array',
            'attendance.min' => 'At least one attendance record is required',
            'attendance.*.student_id.required' => 'Student is required for each attendance record',
            'attendance.*.student_id.exists' => 'Selected student does not exist',
            'attendance.*.academic_year_id.required' => 'Academic year is required for each attendance record',
            'attendance.*.academic_year_id.exists' => 'Selected academic year does not exist',
            'attendance.*.classroom_id.required' => 'Classroom is required for each attendance record',
            'attendance.*.classroom_id.exists' => 'Selected classroom does not exist',
            'attendance.*.section_id.required' => 'Section is required for each attendance record',
            'attendance.*.section_id.exists' => 'Selected section does not exist',
            'attendance.*.attendance_date.required' => 'Attendance date is required for each attendance record',
            'attendance.*.attendance_date.date' => 'Please provide a valid date',
            'attendance.*.status.required' => 'Attendance status is required for each attendance record',
            'attendance.*.status.in' => 'Invalid attendance status',
            'attendance.*.subject_id.exists' => 'Selected subject does not exist',
            'attendance.*.marked_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
