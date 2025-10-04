<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateStudentAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('studentAttendance'));
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(['present', 'absent', 'late', 'excused'])],
            'period' => ['nullable', 'string', 'max:50'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'marked_by' => ['nullable', 'exists:staff,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Invalid attendance status',
            'subject_id.exists' => 'Selected subject does not exist',
            'marked_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
