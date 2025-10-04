<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TransportRouteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school' => new SchoolResource($this->whenLoaded('school')),
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'distance_km' => $this->distance_km,
            'estimated_duration' => $this->estimated_duration?->format('H:i:s'),
            'fare_amount' => $this->fare_amount,
            'is_active' => $this->is_active,
            'stops_count' => $this->whenCounted('stops'),
            'stops' => TransportStopResource::collection($this->whenLoaded('stops')),
            'assignments_count' => $this->whenCounted('assignments'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
