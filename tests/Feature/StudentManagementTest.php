<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

final class StudentManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $admin;
    private School $school;
    private AcademicYear $academicYear;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create permissions
        $permissions = [
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
        ];
        
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }
        
        // Create roles
        Role::create(['name' => 'Admin']);
        Role::create(['name' => 'Student']);
        
        // Create admin user
        $this->admin = User::factory()->create();
        $adminRole = Role::findByName('Admin');
        
        // Give admin all permissions
        $adminRole->givePermissionTo($permissions);
        
        $this->admin->assignRole($adminRole);
        
        // Create school and academic year
        $this->school = School::factory()->create();
        $this->academicYear = AcademicYear::factory()->create(['is_current' => true]);
        
        Sanctum::actingAs($this->admin);
    }

    public function test_can_create_student(): void
    {
        $studentData = [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'password' => 'password123',
            'phone' => '1234567890',
            'address' => '123 Main St',
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'admission_date' => '2024-09-01',
            'blood_group' => 'O+',
            'medical_conditions' => ['None'],
            'emergency_contact' => [
                'name' => 'Jane Doe',
                'phone' => '1234567890',
                'relationship' => 'Mother',
            ],
        ];

        $response = $this->postJson('/api/v1/students', $studentData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'admission_number',
                    'student_id',
                    'user' => [
                        'id',
                        'name',
                        'email',
                    ],
                ],
                'message',
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
        ]);
    }

    public function test_can_get_students_list(): void
    {
        Student::factory(5)->create();

        $response = $this->getJson('/api/v1/students');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'admission_number',
                        'student_id',
                        'user' => [
                            'id',
                            'name',
                            'email',
                        ],
                    ],
                ],
            ]);
    }

    public function test_can_get_single_student(): void
    {
        $student = Student::factory()->create();

        $response = $this->getJson("/api/v1/students/{$student->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'admission_number',
                    'student_id',
                    'user',
                ],
            ]);
    }

    public function test_can_update_student(): void
    {
        $student = Student::factory()->create();

        $updateData = [
            'blood_group' => 'A+',
            'emergency_contact' => [
                'name' => 'Jane Doe',
                'phone' => '9876543210',
                'relationship' => 'Mother',
            ],
        ];

        $response = $this->putJson("/api/v1/students/{$student->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'blood_group' => 'A+',
            ]);

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'blood_group' => 'A+',
        ]);
    }

    public function test_can_delete_student(): void
    {
        $student = Student::factory()->create();

        $response = $this->deleteJson("/api/v1/students/{$student->id}");

        $response->assertStatus(204);
        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'is_active' => false,
        ]);
    }

    public function test_requires_authentication(): void
    {
        // Create a new test case without authentication
        $this->refreshApplication();
        
        $response = $this->getJson('/api/v1/students');
        $response->assertStatus(401);
    }
}
