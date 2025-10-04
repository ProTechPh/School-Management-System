<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'admission_number' => $this->admission_number,
            'admission_date' => $this->admission_date?->format('Y-m-d'),
            'blood_group' => $this->blood_group,
            'medical_conditions' => $this->medical_conditions,
            'emergency_contact' => $this->emergency_contact,
            'is_active' => $this->is_active,
            'user' => new UserResource($this->whenLoaded('user')),
            'guardians' => GuardianResource::collection($this->whenLoaded('guardians')),
            'enrollments' => EnrollmentResource::collection($this->whenLoaded('enrollments')),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
