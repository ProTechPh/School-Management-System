<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

final class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('students.view');
    }

    public function view(User $user, Student $student): bool
    {
        // Students can view their own profile, guardians can view their children's profiles
        if ($user->hasRole('Student') && $user->student?->id === $student->id) {
            return true;
        }

        if ($user->hasRole('Guardian') && $user->guardian?->students->contains($student)) {
            return true;
        }

        return $user->can('students.view');
    }

    public function create(User $user): bool
    {
        return $user->can('students.create');
    }

    public function update(User $user, Student $student): bool
    {
        // Students can update their own profile
        if ($user->hasRole('Student') && $user->student?->id === $student->id) {
            return true;
        }

        return $user->can('students.edit');
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->can('students.delete');
    }

    public function restore(User $user, Student $student): bool
    {
        return $user->can('students.delete');
    }

    public function forceDelete(User $user, Student $student): bool
    {
        return $user->can('students.delete');
    }
}
