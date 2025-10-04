<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BookLoan;
use App\Models\User;
use Illuminate\Auth\Access\Response;

final class BookLoanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('library.view') || 
               $user->hasPermissionTo('library.view-own') ||
               $user->hasPermissionTo('library.view-children');
    }

    public function view(User $user, BookLoan $bookLoan): bool
    {
        // Users can view their own loans or their children's loans
        if ($user->hasPermissionTo('library.view')) {
            return true;
        }

        if ($user->hasPermissionTo('library.view-own') && $user->student && $bookLoan->student_id === $user->student->id) {
            return true;
        }

        if ($user->hasPermissionTo('library.view-children') && $user->guardian) {
            $studentIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($bookLoan->student_id, $studentIds);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('library.create');
    }

    public function update(User $user, BookLoan $bookLoan): bool
    {
        return $user->hasPermissionTo('library.update');
    }

    public function delete(User $user, BookLoan $bookLoan): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function restore(User $user, BookLoan $bookLoan): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function forceDelete(User $user, BookLoan $bookLoan): bool
    {
        return $user->hasPermissionTo('library.delete');
    }
}
