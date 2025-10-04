<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\FeePayment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class FeePaymentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'fees.view',
            'fees.view-own',
            'fees.view-children',
        ]);
    }

    public function view(User $user, FeePayment $feePayment): bool
    {
        // Admin and accountants can view all payments
        if ($user->hasPermissionTo('fees.view')) {
            return true;
        }

        // Students can view their own payments
        if ($user->hasPermissionTo('fees.view-own') && $user->student) {
            return $feePayment->student_id === $user->student->id;
        }

        // Guardians can view their children's payments
        if ($user->hasPermissionTo('fees.view-children') && $user->guardian) {
            $studentIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($feePayment->student_id, $studentIds);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('fees.create');
    }

    public function update(User $user, FeePayment $feePayment): bool
    {
        return $user->hasPermissionTo('fees.update');
    }

    public function delete(User $user, FeePayment $feePayment): bool
    {
        return $user->hasPermissionTo('fees.delete');
    }

    public function restore(User $user, FeePayment $feePayment): bool
    {
        return $user->hasPermissionTo('fees.restore');
    }

    public function forceDelete(User $user, FeePayment $feePayment): bool
    {
        return $user->hasPermissionTo('fees.force-delete');
    }
}
