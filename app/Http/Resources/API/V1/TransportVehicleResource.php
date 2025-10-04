<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TransportVehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school' => new SchoolResource($this->whenLoaded('school')),
            'vehicle_number' => $this->vehicle_number,
            'vehicle_type' => $this->vehicle_type,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'color' => $this->color,
            'capacity' => $this->capacity,
            'driver_name' => $this->driver_name,
            'driver_phone' => $this->driver_phone,
            'driver_license' => $this->driver_license,
            'insurance_expiry' => $this->insurance_expiry,
            'registration_expiry' => $this->registration_expiry,
            'fitness_expiry' => $this->fitness_expiry,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'assignments_count' => $this->whenCounted('assignments'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
