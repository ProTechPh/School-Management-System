<?php

declare(strict_types=1);

namespace App\Services\Transport;

use App\Models\TransportStop;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class TransportStopService
{
    public function getTransportStops(array $filters = []): LengthAwarePaginator
    {
        $query = TransportStop::with(['school']);

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('address', 'like', '%'.$filters['search'].'%')
                    ->orWhere('landmarks', 'like', '%'.$filters['search'].'%');
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (isset($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        return $query->paginate(10);
    }

    public function createTransportStop(array $data): TransportStop
    {
        return TransportStop::create($data);
    }

    public function updateTransportStop(TransportStop $stop, array $data): TransportStop
    {
        $stop->update($data);

        return $stop->fresh();
    }

    public function deleteTransportStop(TransportStop $stop): void
    {
        $stop->delete();
    }

    public function getStopsByRoute(int $routeId): Collection
    {
        return TransportStop::whereHas('routes', function ($query) use ($routeId) {
            $query->where('transport_route_id', $routeId);
        })->orderBy('sequence_order')->get();
    }

    public function getNearbyStops(float $latitude, float $longitude, float $radiusKm = 5): Collection
    {
        // Using Haversine formula for distance calculation
        $query = TransportStop::selectRaw("
            *, 
            (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
        ", [$latitude, $longitude, $latitude])
            ->having('distance', '<=', $radiusKm)
            ->orderBy('distance');

        return $query->get();
    }
}
