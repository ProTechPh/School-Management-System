<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TransportStopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school' => new SchoolResource($this->whenLoaded('school')),
            'name' => $this->name,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'pickup_time' => $this->pickup_time?->format('H:i:s'),
            'drop_time' => $this->drop_time?->format('H:i:s'),
            'landmarks' => $this->landmarks,
            'is_active' => $this->is_active,
            'routes_count' => $this->whenCounted('routes'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
