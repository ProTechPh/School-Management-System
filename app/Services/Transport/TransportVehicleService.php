<?php

declare(strict_types=1);

namespace App\Services\Transport;

use App\Models\TransportVehicle;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class TransportVehicleService
{
    public function getTransportVehicles(array $filters = []): LengthAwarePaginator
    {
        $query = TransportVehicle::with(['school']);

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('vehicle_number', 'like', '%'.$filters['search'].'%')
                    ->orWhere('driver_name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('make', 'like', '%'.$filters['search'].'%')
                    ->orWhere('model', 'like', '%'.$filters['search'].'%');
            });
        }

        if (isset($filters['vehicle_type'])) {
            $query->where('vehicle_type', $filters['vehicle_type']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (isset($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        return $query->paginate(10);
    }

    public function createTransportVehicle(array $data): TransportVehicle
    {
        return TransportVehicle::create($data);
    }

    public function updateTransportVehicle(TransportVehicle $vehicle, array $data): TransportVehicle
    {
        $vehicle->update($data);

        return $vehicle->fresh();
    }

    public function deleteTransportVehicle(TransportVehicle $vehicle): void
    {
        $vehicle->delete();
    }

    public function getAvailableVehicles(): Collection
    {
        return TransportVehicle::where('is_active', true)
            ->whereDoesntHave('assignments', function ($query) {
                $query->where('status', 'active')
                    ->where('end_date', null)
                    ->orWhere('end_date', '>', now());
            })
            ->get();
    }

    public function getVehiclesByType(string $type): Collection
    {
        return TransportVehicle::where('vehicle_type', $type)
            ->where('is_active', true)
            ->get();
    }

    public function getExpiringDocuments(): Collection
    {
        $thirtyDaysFromNow = now()->addDays(30);

        return TransportVehicle::where('is_active', true)
            ->where(function ($query) use ($thirtyDaysFromNow) {
                $query->where('insurance_expiry', '<=', $thirtyDaysFromNow)
                    ->orWhere('registration_expiry', '<=', $thirtyDaysFromNow)
                    ->orWhere('fitness_expiry', '<=', $thirtyDaysFromNow);
            })
            ->get();
    }
}
