<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Book;
use App\Models\User;
use Illuminate\Auth\Access\Response;

final class BookPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('library.view') || 
               $user->hasPermissionTo('library.view-own') ||
               $user->hasPermissionTo('library.view-children');
    }

    public function view(User $user, Book $book): bool
    {
        return $user->hasPermissionTo('library.view') || 
               $user->hasPermissionTo('library.view-own') ||
               $user->hasPermissionTo('library.view-children');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('library.create');
    }

    public function update(User $user, Book $book): bool
    {
        return $user->hasPermissionTo('library.update');
    }

    public function delete(User $user, Book $book): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function restore(User $user, Book $book): bool
    {
        return $user->hasPermissionTo('library.delete');
    }

    public function forceDelete(User $user, Book $book): bool
    {
        return $user->hasPermissionTo('library.delete');
    }
}
