<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class ReturnBookLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'returned_by' => 'nullable|exists:staff,id',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'returned_by.exists' => 'Selected staff does not exist',
        ];
    }
}
