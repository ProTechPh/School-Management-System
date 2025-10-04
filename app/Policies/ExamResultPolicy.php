<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ExamResult;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class ExamResultPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'exam-results.view',
            'exam-results.view-own',
            'exam-results.view-children',
        ]);
    }

    public function view(User $user, ExamResult $examResult): bool
    {
        // Admin and teachers can view all results
        if ($user->hasPermissionTo('exam-results.view')) {
            return true;
        }

        // Students can view their own results
        if ($user->hasPermissionTo('exam-results.view-own') && $user->student) {
            return $examResult->student_id === $user->student->id;
        }

        // Guardians can view their children's results
        if ($user->hasPermissionTo('exam-results.view-children') && $user->guardian) {
            $studentIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($examResult->student_id, $studentIds);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('exam-results.create');
    }

    public function update(User $user, ExamResult $examResult): bool
    {
        return $user->hasPermissionTo('exam-results.update');
    }

    public function delete(User $user, ExamResult $examResult): bool
    {
        return $user->hasPermissionTo('exam-results.delete');
    }

    public function restore(User $user, ExamResult $examResult): bool
    {
        return $user->hasPermissionTo('exam-results.restore');
    }

    public function forceDelete(User $user, ExamResult $examResult): bool
    {
        return $user->hasPermissionTo('exam-results.force-delete');
    }
}
