<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Fees;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeeInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_date' => 'sometimes|date',
            'due_date' => 'sometimes|date|after_or_equal:invoice_date',
            'total_amount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_date.date' => 'Invoice date must be a valid date',
            'due_date.date' => 'Due date must be a valid date',
            'due_date.after_or_equal' => 'Due date must be on or after invoice date',
            'total_amount.numeric' => 'Total amount must be a number',
            'total_amount.min' => 'Total amount cannot be negative',
            'notes.max' => 'Notes cannot exceed 500 characters',
        ];
    }
}
