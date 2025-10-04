<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class WaiveBookFineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'waived_by' => 'nullable|exists:staff,id',
            'waived_reason' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'waived_by.exists' => 'Selected staff does not exist',
            'waived_reason.max' => 'Waived reason cannot exceed 500 characters',
        ];
    }
}
