<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Fees;

use Illuminate\Foundation\Http\FormRequest;

final class StoreFeeInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'fee_structure_id' => 'required|exists:fee_structures,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'created_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'Student is required',
            'student_id.exists' => 'Selected student does not exist',
            'fee_structure_id.required' => 'Fee structure is required',
            'fee_structure_id.exists' => 'Selected fee structure does not exist',
            'academic_year_id.required' => 'Academic year is required',
            'academic_year_id.exists' => 'Selected academic year does not exist',
            'invoice_date.required' => 'Invoice date is required',
            'invoice_date.date' => 'Invoice date must be a valid date',
            'due_date.required' => 'Due date is required',
            'due_date.date' => 'Due date must be a valid date',
            'due_date.after_or_equal' => 'Due date must be on or after invoice date',
            'total_amount.required' => 'Total amount is required',
            'total_amount.numeric' => 'Total amount must be a number',
            'total_amount.min' => 'Total amount cannot be negative',
            'notes.max' => 'Notes cannot exceed 500 characters',
            'created_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
