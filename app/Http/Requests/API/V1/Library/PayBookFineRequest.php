<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class PayBookFineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paid_amount' => 'required|numeric|min:0.01',
            'paid_date' => 'nullable|date|before_or_equal:today',
            'collected_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'paid_amount.required' => 'Paid amount is required',
            'paid_amount.numeric' => 'Paid amount must be a number',
            'paid_amount.min' => 'Paid amount must be at least 0.01',
            'paid_date.before_or_equal' => 'Paid date cannot be in the future',
            'collected_by.exists' => 'Selected staff does not exist',
        ];
    }
}
