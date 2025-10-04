<?php

declare(strict_types=1);

namespace App\Services\Students;

use App\Models\Student;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class StudentService
{
    public function getStudents(array $filters = []): LengthAwarePaginator
    {
        $query = Student::with(['user', 'guardians.user', 'enrollments']);

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function createStudent(array $data): Student
    {
        return DB::transaction(function () use ($data) {
            // Create user first
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt($data['password']),
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'is_active' => true,
            ]);

            // Assign student role
            $user->assignRole('Student');

            // Create student profile
            $student = Student::create([
                'user_id' => $user->id,
                'student_id' => $this->generateStudentId(),
                'admission_number' => $this->generateAdmissionNumber(),
                'admission_date' => $data['admission_date'] ?? now(),
                'blood_group' => $data['blood_group'] ?? null,
                'medical_conditions' => $data['medical_conditions'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'is_active' => true,
            ]);

            return $student->load(['user', 'guardians']);
        });
    }

    public function updateStudent(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data) {
            // Update user data
            if (isset($data['name']) || isset($data['email']) || isset($data['phone']) || 
                isset($data['address']) || isset($data['date_of_birth']) || isset($data['gender'])) {
                
                $userData = array_filter([
                    'name' => $data['name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'date_of_birth' => $data['date_of_birth'] ?? null,
                    'gender' => $data['gender'] ?? null,
                ], fn($value) => $value !== null);

                $student->user->update($userData);
            }

            // Update student data
            $studentData = array_filter([
                'blood_group' => $data['blood_group'] ?? null,
                'medical_conditions' => $data['medical_conditions'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'is_active' => $data['is_active'] ?? null,
            ], fn($value) => $value !== null);

            $student->update($studentData);

            return $student->load(['user', 'guardians']);
        });
    }

    public function deleteStudent(Student $student): void
    {
        DB::transaction(function () use ($student) {
            // Soft delete student
            $student->update(['is_active' => false]);
            
            // Deactivate user
            $student->user->update(['is_active' => false]);
        });
    }

    private function generateStudentId(): string
    {
        do {
            $studentId = 'STU' . str_pad((string) rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Student::where('student_id', $studentId)->exists());

        return $studentId;
    }

    private function generateAdmissionNumber(): string
    {
        do {
            $admissionNumber = 'ADM' . date('Y') . str_pad((string) rand(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Student::where('admission_number', $admissionNumber)->exists());

        return $admissionNumber;
    }
}
