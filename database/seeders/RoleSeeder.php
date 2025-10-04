<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            // Students
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
            
            // Guardians
            'guardians.view',
            'guardians.create',
            'guardians.edit',
            'guardians.delete',
            
            // Staff
            'staff.view',
            'staff.create',
            'staff.edit',
            'staff.delete',
            
            // Classes & Sections
            'classes.view',
            'classes.create',
            'classes.edit',
            'classes.delete',
            
            'sections.view',
            'sections.create',
            'sections.edit',
            'sections.delete',
            
            // Subjects
            'subjects.view',
            'subjects.create',
            'subjects.edit',
            'subjects.delete',
            
            // Enrollments
            'enrollments.view',
            'enrollments.create',
            'enrollments.edit',
            'enrollments.delete',
            
            // Attendance
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            
            // Exams
            'exams.view',
            'exams.create',
            'exams.edit',
            'exams.delete',
            
            // Exam Results
            'exam-results.view',
            'exam-results.view-own',
            'exam-results.view-children',
            'exam-results.create',
            'exam-results.update',
            'exam-results.delete',
            
            // Fees
            'fees.view',
            'fees.view-own',
            'fees.view-children',
            'fees.create',
            'fees.update',
            'fees.delete',
            
        // Library
        'library.view',
        'library.view-own',
        'library.view-children',
        'library.create',
        'library.edit',
        'library.update',
        'library.delete',

        // Transport
        'transport.view',
        'transport.view-own',
        'transport.view-children',
        'transport.create',
        'transport.edit',
        'transport.update',
        'transport.delete',

        // HR
        'hr.view',
        'hr.view-own',
        'hr.create',
        'hr.edit',
        'hr.update',
        'hr.delete',

        // Inventory
        'inventory.view',
        'inventory.create',
        'inventory.edit',
        'inventory.update',
        'inventory.delete',

        // Notices
        'notices.view',
        'notices.create',
        'notices.edit',
        'notices.update',
        'notices.delete',

        // Events
        'events.view',
        'events.create',
        'events.edit',
        'events.update',
        'events.delete',

        // Messages
        'messages.view',
        'messages.view-own',
        'messages.create',
        'messages.edit',
        'messages.update',
        'messages.delete',
            
            // Reports
            'reports.view',
            'reports.generate',
            
            // Settings
            'settings.view',
            'settings.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $roles = [
            'Admin' => $permissions, // Admin has all permissions
            'Teacher' => [
                'students.view',
                'attendance.view',
                'attendance.create',
                'attendance.edit',
                'exams.view',
                'exams.create',
                'exams.edit',
                'exam-results.view',
                'exam-results.create',
                'exam-results.update',
                'subjects.view',
                'classes.view',
                'sections.view',
                'hr.view-own', // Can view own payroll and leave requests
                'notices.view',
                'events.view',
                'messages.view-own', // Can view own messages
            ],
            'Accountant' => [
                'fees.view',
                'fees.create',
                'fees.update',
                'fees.delete',
                'students.view',
                'reports.view',
                'reports.generate',
            ],
            'Librarian' => [
                'library.view',
                'library.create',
                'library.edit',
                'library.update',
                'library.delete',
                'students.view',
            ],
        'TransportManager' => [
            'transport.view',
            'transport.create',
            'transport.edit',
            'transport.update',
            'transport.delete',
            'students.view',
        ],
            'HR' => [
                'hr.view',
                'hr.create',
                'hr.edit',
                'hr.update',
                'hr.delete',
                'staff.view',
                'staff.create',
                'staff.edit',
                'staff.delete',
                'notices.view',
                'events.view',
                'messages.view',
                'messages.create',
            ],
            'InventoryManager' => [
                'inventory.view',
                'inventory.create',
                'inventory.edit',
                'inventory.update',
                'inventory.delete',
            ],
            'Student' => [
                'students.view', // Can view own profile
                'attendance.view', // Can view own attendance
                'exams.view', // Can view own exam results
                'exam-results.view-own', // Can view own exam results
                'fees.view-own', // Can view own fees
                'library.view-own', // Can view own loans and fines
                'transport.view-own', // Can view own transport assignments
                'notices.view',
                'events.view',
                'messages.view-own', // Can view own messages
            ],
            'Guardian' => [
                'students.view', // Can view children's profiles
                'attendance.view', // Can view children's attendance
                'exams.view', // Can view children's exam results
                'exam-results.view-children', // Can view children's exam results
                'fees.view-children', // Can view children's fees
                'library.view-children', // Can view children's loans and fines
                'transport.view-children', // Can view children's transport assignments
                'notices.view',
                'events.view',
                'messages.view-own', // Can view own messages
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($rolePermissions);
        }
    }
}