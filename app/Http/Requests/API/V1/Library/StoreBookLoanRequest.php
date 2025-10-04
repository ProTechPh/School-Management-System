<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class StoreBookLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_id' => 'required|exists:books,id',
            'book_copy_id' => 'required|exists:book_copies,id',
            'student_id' => 'nullable|exists:students,id',
            'staff_id' => 'nullable|exists:staff,id',
            'loan_date' => 'required|date|before_or_equal:today',
            'due_date' => 'required|date|after:loan_date',
            'notes' => 'nullable|string',
            'issued_by' => 'required|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'book_id.required' => 'Book is required',
            'book_id.exists' => 'Selected book does not exist',
            'book_copy_id.required' => 'Book copy is required',
            'book_copy_id.exists' => 'Selected book copy does not exist',
            'student_id.exists' => 'Selected student does not exist',
            'staff_id.exists' => 'Selected staff does not exist',
            'loan_date.required' => 'Loan date is required',
            'loan_date.before_or_equal' => 'Loan date cannot be in the future',
            'due_date.required' => 'Due date is required',
            'due_date.after' => 'Due date must be after loan date',
            'issued_by.required' => 'Issued by is required',
            'issued_by.exists' => 'Selected staff does not exist',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->student_id && $this->staff_id) {
                $validator->errors()->add('borrower', 'Cannot assign both student and staff as borrower');
            }

            if (!$this->student_id && !$this->staff_id) {
                $validator->errors()->add('borrower', 'Either student or staff must be selected as borrower');
            }
        });
    }
}
