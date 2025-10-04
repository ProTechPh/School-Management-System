<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TransportAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => new StudentResource($this->whenLoaded('student')),
            'transport_route' => new TransportRouteResource($this->whenLoaded('transportRoute')),
            'transport_vehicle' => new TransportVehicleResource($this->whenLoaded('transportVehicle')),
            'pickup_stop' => new TransportStopResource($this->whenLoaded('pickupStop')),
            'drop_stop' => new TransportStopResource($this->whenLoaded('dropStop')),
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'monthly_fare' => $this->monthly_fare,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
