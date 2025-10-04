<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class FeeInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->student ? new UserResource($this->student->user) : null,
            'fee_structure' => [
                'id' => $this->feeStructure->id ?? null,
                'name' => $this->feeStructure->name ?? null,
                'fee_type' => $this->feeStructure->fee_type ?? null,
                'amount' => $this->feeStructure->amount ?? null,
            ],
            'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'invoice_number' => $this->invoice_number,
            'invoice_date' => $this->invoice_date,
            'due_date' => $this->due_date,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'balance_amount' => $this->balance_amount,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_by' => new StaffResource($this->whenLoaded('createdBy')),
            'payments' => FeePaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
