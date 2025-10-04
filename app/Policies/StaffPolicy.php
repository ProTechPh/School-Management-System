<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Staff;
use App\Models\User;

final class StaffPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('staff.view');
    }

    public function view(User $user, Staff $staff): bool
    {
        // Staff can view their own profile
        if ($user->hasRole('Teacher') && $user->staff?->id === $staff->id) {
            return true;
        }

        return $user->can('staff.view');
    }

    public function create(User $user): bool
    {
        return $user->can('staff.create');
    }

    public function update(User $user, Staff $staff): bool
    {
        // Staff can update their own profile
        if ($user->hasRole('Teacher') && $user->staff?->id === $staff->id) {
            return true;
        }

        return $user->can('staff.edit');
    }

    public function delete(User $user, Staff $staff): bool
    {
        return $user->can('staff.delete');
    }

    public function restore(User $user, Staff $staff): bool
    {
        return $user->can('staff.delete');
    }

    public function forceDelete(User $user, Staff $staff): bool
    {
        return $user->can('staff.delete');
    }
}
