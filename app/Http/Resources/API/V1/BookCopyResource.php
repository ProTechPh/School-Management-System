<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BookCopyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book' => new BookResource($this->whenLoaded('book')),
            'copy_number' => $this->copy_number,
            'barcode' => $this->barcode,
            'purchase_date' => $this->purchase_date,
            'purchase_price' => $this->purchase_price,
            'condition' => $this->condition,
            'location' => $this->location,
            'status' => $this->status,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'is_available' => $this->status === 'available',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
