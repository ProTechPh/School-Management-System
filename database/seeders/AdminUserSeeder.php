<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@demoschool.edu',
            'password' => Hash::make('password'),
            'phone' => '+1-555-0001',
            'address' => '123 Admin Street, Learning City, LC 12345',
            'date_of_birth' => '1980-01-01',
            'gender' => 'other',
            'is_active' => true,
        ]);

        // Assign admin role
        $admin->assignRole('Admin');

        // Create sample teacher
        $teacher = User::create([
            'name' => 'John Doe',
            'email' => 'teacher@demoschool.edu',
            'password' => Hash::make('password'),
            'phone' => '+1-555-0002',
            'address' => '456 Teacher Lane, Learning City, LC 12345',
            'date_of_birth' => '1985-05-15',
            'gender' => 'male',
            'is_active' => true,
        ]);

        $teacher->assignRole('Teacher');

        // Create sample student
        $student = User::create([
            'name' => 'Alice Johnson',
            'email' => 'student@demoschool.edu',
            'password' => Hash::make('password'),
            'phone' => '+1-555-0003',
            'address' => '789 Student Avenue, Learning City, LC 12345',
            'date_of_birth' => '2010-03-20',
            'gender' => 'female',
            'is_active' => true,
        ]);

        $student->assignRole('Student');

        // Create sample guardian
        $guardian = User::create([
            'name' => 'Robert Johnson',
            'email' => 'guardian@demoschool.edu',
            'password' => Hash::make('password'),
            'phone' => '+1-555-0004',
            'address' => '789 Student Avenue, Learning City, LC 12345',
            'date_of_birth' => '1980-08-10',
            'gender' => 'male',
            'is_active' => true,
        ]);

        $guardian->assignRole('Guardian');
    }
}