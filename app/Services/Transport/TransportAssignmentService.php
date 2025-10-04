<?php

declare(strict_types=1);

namespace App\Services\Transport;

use App\Models\Student;
use App\Models\TransportAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class TransportAssignmentService
{
    public function getTransportAssignments(array $filters = []): LengthAwarePaginator
    {
        $query = TransportAssignment::with([
            'student.user',
            'transportRoute',
            'transportVehicle',
            'pickupStop',
            'dropStop'
        ]);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['route_id'])) {
            $query->where('transport_route_id', $filters['route_id']);
        }

        if (isset($filters['vehicle_id'])) {
            $query->where('transport_vehicle_id', $filters['vehicle_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_active'])) {
            if ($filters['is_active']) {
                $query->where('status', 'active')
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>', now());
                    });
            } else {
                $query->where(function ($q) {
                    $q->where('status', '!=', 'active')
                        ->orWhere('end_date', '<=', now());
                });
            }
        }

        return $query->paginate(10);
    }

    public function createTransportAssignment(array $data): TransportAssignment
    {
        return TransportAssignment::create($data);
    }

    public function updateTransportAssignment(TransportAssignment $assignment, array $data): TransportAssignment
    {
        $assignment->update($data);

        return $assignment->fresh();
    }

    public function deleteTransportAssignment(TransportAssignment $assignment): void
    {
        $assignment->delete();
    }

    public function getStudentAssignments(int $studentId): Collection
    {
        return TransportAssignment::with([
            'transportRoute',
            'transportVehicle',
            'pickupStop',
            'dropStop'
        ])
            ->where('student_id', $studentId)
            ->orderBy('start_date', 'desc')
            ->get();
    }

    public function getActiveStudentAssignment(int $studentId): ?TransportAssignment
    {
        return TransportAssignment::with([
            'transportRoute',
            'transportVehicle',
            'pickupStop',
            'dropStop'
        ])
            ->where('student_id', $studentId)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>', now());
            })
            ->first();
    }

    public function getRouteAssignments(int $routeId): Collection
    {
        return TransportAssignment::with([
            'student.user',
            'transportVehicle',
            'pickupStop',
            'dropStop'
        ])
            ->where('transport_route_id', $routeId)
            ->where('status', 'active')
            ->get();
    }

    public function getVehicleAssignments(int $vehicleId): Collection
    {
        return TransportAssignment::with([
            'student.user',
            'transportRoute',
            'pickupStop',
            'dropStop'
        ])
            ->where('transport_vehicle_id', $vehicleId)
            ->where('status', 'active')
            ->get();
    }

    public function getAssignmentsForUser(User $user): Collection
    {
        if ($user->hasRole('Student') && $user->student) {
            return $this->getStudentAssignments($user->student->id);
        }

        if ($user->hasRole('Guardian') && $user->guardian) {
            $studentIds = $user->guardian->students->pluck('id');
            return TransportAssignment::with([
                'student.user',
                'transportRoute',
                'transportVehicle',
                'pickupStop',
                'dropStop'
            ])
                ->whereIn('student_id', $studentIds)
                ->orderBy('start_date', 'desc')
                ->get();
        }

        return collect();
    }

    public function suspendAssignment(TransportAssignment $assignment, string $reason = null): TransportAssignment
    {
        $assignment->update([
            'status' => 'suspended',
            'notes' => $reason ? ($assignment->notes . "\nSuspended: " . $reason) : $assignment->notes,
        ]);

        return $assignment->fresh();
    }

    public function reactivateAssignment(TransportAssignment $assignment): TransportAssignment
    {
        $assignment->update([
            'status' => 'active',
        ]);

        return $assignment->fresh();
    }

    public function cancelAssignment(TransportAssignment $assignment, string $reason = null): TransportAssignment
    {
        $assignment->update([
            'status' => 'cancelled',
            'end_date' => now(),
            'notes' => $reason ? ($assignment->notes . "\nCancelled: " . $reason) : $assignment->notes,
        ]);

        return $assignment->fresh();
    }
}
