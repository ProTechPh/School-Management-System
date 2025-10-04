<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BookFine;
use App\Models\User;
use Illuminate\Auth\Access\Response;

final class BookFinePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('library.view') || 
               $user->hasPermissionTo('library.view-own') ||
               $user->hasPermissionTo('library.view-children');
    }

    public function view(User $user, BookFine $bookFine): bool
    {
        // Users can view their own fines or their children's fines
        if ($user->hasPermissionTo('library.view')) {
            return true;
        }

        if ($user->hasPermissionTo('library.view-own') && $user->student && $bookFine->student_id === $user->student->id) {
            return true;
        }

        if ($user->hasPermissionTo('library.view-children') && $user->guardian) {
            $studentIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($bookFine->student_id, $studentIds);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('library.create');
    }

    public function update(User $user, BookFine $bookFine): bool
    {
        return $user->hasPermissionTo('library.update');
    }

    public function delete(User $user, BookFine $bookFine): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function restore(User $user, BookFine $bookFine): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function forceDelete(User $user, BookFine $bookFine): bool
    {
        return $user->hasPermissionTo('library.delete');
    }
}
