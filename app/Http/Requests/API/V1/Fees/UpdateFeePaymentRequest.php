<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Fees;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_date' => 'sometimes|date',
            'amount' => 'sometimes|numeric|min:0.01',
            'payment_method' => 'sometimes|in:cash,cheque,bank_transfer,card,other',
            'payment_reference' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'cheque_number' => 'nullable|string|max:50',
            'transaction_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'received_by' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'payment_date.date' => 'Payment date must be a valid date',
            'amount.numeric' => 'Amount must be a number',
            'amount.min' => 'Amount must be greater than 0',
            'payment_method.in' => 'Invalid payment method',
            'payment_reference.max' => 'Payment reference cannot exceed 100 characters',
            'bank_name.max' => 'Bank name cannot exceed 100 characters',
            'cheque_number.max' => 'Cheque number cannot exceed 50 characters',
            'transaction_id.max' => 'Transaction ID cannot exceed 100 characters',
            'notes.max' => 'Notes cannot exceed 500 characters',
            'received_by.exists' => 'Selected staff member does not exist',
        ];
    }
}
