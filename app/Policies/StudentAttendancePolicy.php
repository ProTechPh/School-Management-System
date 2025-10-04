<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\StudentAttendance;
use App\Models\User;

final class StudentAttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('attendance.view');
    }

    public function view(User $user, StudentAttendance $studentAttendance): bool
    {
        // Students can view their own attendance, guardians can view their children's attendance
        if ($user->hasRole('Student') && $user->student?->id === $studentAttendance->student_id) {
            return true;
        }

        if ($user->hasRole('Guardian') && $user->guardian?->students->contains($studentAttendance->student)) {
            return true;
        }

        return $user->can('attendance.view');
    }

    public function create(User $user): bool
    {
        return $user->can('attendance.create');
    }

    public function update(User $user, StudentAttendance $studentAttendance): bool
    {
        return $user->can('attendance.edit');
    }

    public function delete(User $user, StudentAttendance $studentAttendance): bool
    {
        return $user->can('attendance.delete');
    }

    public function restore(User $user, StudentAttendance $studentAttendance): bool
    {
        return $user->can('attendance.delete');
    }

    public function forceDelete(User $user, StudentAttendance $studentAttendance): bool
    {
        return $user->can('attendance.delete');
    }
}
