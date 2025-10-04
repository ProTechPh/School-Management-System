<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class FeePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fee_invoice' => [
                'id' => $this->feeInvoice->id ?? null,
                'invoice_number' => $this->feeInvoice->invoice_number ?? null,
                'total_amount' => $this->feeInvoice->total_amount ?? null,
                'balance_amount' => $this->feeInvoice->balance_amount ?? null,
            ],
            'student' => $this->student ? new UserResource($this->student->user) : null,
            'payment_date' => $this->payment_date,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'bank_name' => $this->bank_name,
            'cheque_number' => $this->cheque_number,
            'transaction_id' => $this->transaction_id,
            'notes' => $this->notes,
            'received_by' => new StaffResource($this->whenLoaded('receivedBy')),
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
