<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Fees;

use Illuminate\Foundation\Http\FormRequest;

final class BulkInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'fee_structure_id' => 'required|exists:fee_structures,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ];
    }

    public function messages(): array
    {
        return [
            'student_ids.required' => 'Student IDs array is required',
            'student_ids.array' => 'Student IDs must be an array',
            'student_ids.min' => 'At least one student is required',
            'student_ids.*.exists' => 'One or more selected students do not exist',
            'fee_structure_id.required' => 'Fee structure is required',
            'fee_structure_id.exists' => 'Selected fee structure does not exist',
            'academic_year_id.required' => 'Academic year is required',
            'academic_year_id.exists' => 'Selected academic year does not exist',
        ];
    }
}
