<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateBookLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'due_date' => 'sometimes|date|after:loan_date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:active,returned,overdue,lost',
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.after' => 'Due date must be after loan date',
            'status.in' => 'Status must be one of: active, returned, overdue, lost',
        ];
    }
}
