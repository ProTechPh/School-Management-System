<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BookLoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book' => new BookResource($this->whenLoaded('book')),
            'book_copy' => new BookCopyResource($this->whenLoaded('bookCopy')),
            'student' => $this->when($this->student, function () {
                return new UserResource($this->student->user);
            }),
            'staff' => $this->when($this->staff, function () {
                return new UserResource($this->staff->user);
            }),
            'loan_date' => $this->loan_date,
            'due_date' => $this->due_date,
            'returned_at' => $this->returned_at,
            'returned_by' => $this->when($this->returnedBy, function () {
                return new UserResource($this->returnedBy->user);
            }),
            'fine_amount' => $this->fine_amount,
            'fine_paid' => $this->fine_paid,
            'status' => $this->status,
            'notes' => $this->notes,
            'issued_by' => $this->when($this->issuedBy, function () {
                return new UserResource($this->issuedBy->user);
            }),
            'is_overdue' => $this->isOverdue(),
            'days_overdue' => $this->status === 'active' ? max(0, now()->diffInDays($this->due_date, false)) : 0,
            'calculated_fine' => $this->calculateFine(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
