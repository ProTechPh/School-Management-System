<?php

declare(strict_types=1);

namespace App\Services\Transport;

use App\Models\TransportRoute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class TransportRouteService
{
    public function getTransportRoutes(array $filters = []): LengthAwarePaginator
    {
        $query = TransportRoute::with(['school', 'stops']);

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('code', 'like', '%'.$filters['search'].'%');
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

    public function createTransportRoute(array $data): TransportRoute
    {
        return TransportRoute::create($data);
    }

    public function updateTransportRoute(TransportRoute $route, array $data): TransportRoute
    {
        $route->update($data);

        return $route->fresh();
    }

    public function deleteTransportRoute(TransportRoute $route): void
    {
        $route->delete();
    }

    public function getRouteStops(TransportRoute $route): Collection
    {
        return $route->stops()->orderBy('sequence_order')->get();
    }

    public function addStopToRoute(TransportRoute $route, int $stopId, int $sequenceOrder, array $timingData = []): void
    {
        $route->stops()->attach($stopId, array_merge([
            'sequence_order' => $sequenceOrder,
        ], $timingData));
    }

    public function removeStopFromRoute(TransportRoute $route, int $stopId): void
    {
        $route->stops()->detach($stopId);
    }

    public function updateRouteStopSequence(TransportRoute $route, int $stopId, int $newSequenceOrder): void
    {
        $route->stops()->updateExistingPivot($stopId, [
            'sequence_order' => $newSequenceOrder,
        ]);
    }
}
