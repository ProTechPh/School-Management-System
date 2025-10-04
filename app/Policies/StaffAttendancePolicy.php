<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\StaffAttendance;
use App\Models\User;

final class StaffAttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('attendance.view');
    }

    public function view(User $user, StaffAttendance $staffAttendance): bool
    {
        // Staff can view their own attendance
        if ($user->hasRole('Teacher') && $user->staff?->id === $staffAttendance->staff_id) {
            return true;
        }

        return $user->can('attendance.view');
    }

    public function create(User $user): bool
    {
        return $user->can('attendance.create');
    }

    public function update(User $user, StaffAttendance $staffAttendance): bool
    {
        // Staff can update their own attendance (check-in/check-out)
        if ($user->hasRole('Teacher') && $user->staff?->id === $staffAttendance->staff_id) {
            return true;
        }

        return $user->can('attendance.edit');
    }

    public function delete(User $user, StaffAttendance $staffAttendance): bool
    {
        return $user->can('attendance.delete');
    }

    public function restore(User $user, StaffAttendance $staffAttendance): bool
    {
        return $user->can('attendance.delete');
    }

    public function forceDelete(User $user, StaffAttendance $staffAttendance): bool
    {
        return $user->can('attendance.delete');
    }
}
