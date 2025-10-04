<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateBookFineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'sometimes|numeric|min:0',
            'fine_type' => 'sometimes|in:overdue,damage,loss',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,paid,waived,cancelled',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.numeric' => 'Fine amount must be a number',
            'amount.min' => 'Fine amount must be at least 0',
            'fine_type.in' => 'Fine type must be one of: overdue, damage, loss',
            'status.in' => 'Status must be one of: pending, paid, waived, cancelled',
        ];
    }
}
