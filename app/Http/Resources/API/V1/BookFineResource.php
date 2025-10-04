<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BookFineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_loan' => $this->when($this->bookLoan, function () {
                return [
                    'id' => $this->bookLoan->id,
                    'book' => new BookResource($this->bookLoan->book),
                    'loan_date' => $this->bookLoan->loan_date,
                    'due_date' => $this->bookLoan->due_date,
                ];
            }),
            'student' => $this->when($this->student, function () {
                return new UserResource($this->student->user);
            }),
            'amount' => $this->amount,
            'fine_type' => $this->fine_type,
            'description' => $this->description,
            'due_date' => $this->due_date,
            'paid_date' => $this->paid_date,
            'paid_amount' => $this->paid_amount,
            'status' => $this->status,
            'waived_by' => $this->when($this->waivedBy, function () {
                return new UserResource($this->waivedBy->user);
            }),
            'waived_reason' => $this->waived_reason,
            'collected_by' => $this->when($this->collectedBy, function () {
                return new UserResource($this->collectedBy->user);
            }),
            'is_overdue' => $this->isOverdue(),
            'remaining_amount' => $this->getRemainingAmount(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
