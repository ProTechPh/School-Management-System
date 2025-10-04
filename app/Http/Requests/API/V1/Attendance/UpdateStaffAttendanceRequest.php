<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateStaffAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('staffAttendance'));
    }

    public function rules(): array
    {
        return [
            'check_in_time' => ['nullable', 'date_format:H:i:s'],
            'check_out_time' => ['nullable', 'date_format:H:i:s', 'after:check_in_time'],
            'status' => ['sometimes', Rule::in(['present', 'absent', 'late', 'half_day', 'on_leave'])],
            'remarks' => ['nullable', 'string', 'max:500'],
            'marked_by' => ['nullable', 'exists:staff,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'check_in_time.date_format' => 'Check-in time must be in HH:MM:SS format',
            'check_out_time.date_format' => 'Check-out time must be in HH:MM:SS format',
            'check_out_time.after' => 'Check-out time must be after check-in time',
            'status.in' => 'Invalid attendance status',
            'marked_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
