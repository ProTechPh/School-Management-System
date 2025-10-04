<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class GuardianResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'occupation' => $this->occupation,
            'workplace' => $this->workplace,
            'monthly_income' => $this->monthly_income,
            'is_emergency_contact' => $this->is_emergency_contact,
            'user' => new UserResource($this->whenLoaded('user')),
            'relationship' => $this->whenPivotLoaded('guardian_student', function () {
                return $this->pivot->relationship;
            }),
            'is_primary' => $this->whenPivotLoaded('guardian_student', function () {
                return $this->pivot->is_primary;
            }),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
