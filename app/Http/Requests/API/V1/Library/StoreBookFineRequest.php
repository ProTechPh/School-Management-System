<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class StoreBookFineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_loan_id' => 'required|exists:book_loans,id',
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'fine_type' => 'required|in:overdue,damage,loss',
            'description' => 'nullable|string',
            'due_date' => 'required|date|after:today',
        ];
    }

    public function messages(): array
    {
        return [
            'book_loan_id.required' => 'Book loan is required',
            'book_loan_id.exists' => 'Selected book loan does not exist',
            'student_id.required' => 'Student is required',
            'student_id.exists' => 'Selected student does not exist',
            'amount.required' => 'Fine amount is required',
            'amount.numeric' => 'Fine amount must be a number',
            'amount.min' => 'Fine amount must be at least 0',
            'fine_type.required' => 'Fine type is required',
            'fine_type.in' => 'Fine type must be one of: overdue, damage, loss',
            'due_date.required' => 'Due date is required',
            'due_date.after' => 'Due date must be in the future',
        ];
    }
}
