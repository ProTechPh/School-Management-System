<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run seeders to create roles and basic data
        $this->seed([
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\SchoolSeeder::class,
        ]);
    }

    public function test_teacher_can_mark_student_attendance(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $student = User::factory()->create();
        $student->assignRole('Student');
        
        $studentProfile = Student::factory()->create(['user_id' => $student->id]);
        
        $academicYear = AcademicYear::first();
        $classroom = Classroom::first();
        $section = Section::first();

        $token = $teacher->createToken('test-token')->plainTextToken;

        $attendanceData = [
            'student_id' => $studentProfile->id,
            'academic_year_id' => $academicYear->id,
            'classroom_id' => $classroom->id,
            'section_id' => $section->id,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
            'period' => '1st Period',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/student-attendance', $attendanceData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'attendance_date',
                    'status',
                    'period',
                    'student' => [
                        'id',
                        'student_id',
                    ],
                ],
                'message',
            ]);
    }

    public function test_teacher_can_bulk_mark_attendance(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $students = User::factory()->count(3)->create();
        $studentProfiles = [];
        
        foreach ($students as $student) {
            $student->assignRole('Student');
            $studentProfiles[] = Student::factory()->create(['user_id' => $student->id]);
        }
        
        $academicYear = AcademicYear::first();
        $classroom = Classroom::first();
        $section = Section::first();

        $token = $teacher->createToken('test-token')->plainTextToken;

        $attendanceData = [
            'attendance' => [
                [
                    'student_id' => $studentProfiles[0]->id,
                    'academic_year_id' => $academicYear->id,
                    'classroom_id' => $classroom->id,
                    'section_id' => $section->id,
                    'attendance_date' => now()->toDateString(),
                    'status' => 'present',
                ],
                [
                    'student_id' => $studentProfiles[1]->id,
                    'academic_year_id' => $academicYear->id,
                    'classroom_id' => $classroom->id,
                    'section_id' => $section->id,
                    'attendance_date' => now()->toDateString(),
                    'status' => 'absent',
                ],
                [
                    'student_id' => $studentProfiles[2]->id,
                    'academic_year_id' => $academicYear->id,
                    'classroom_id' => $classroom->id,
                    'section_id' => $section->id,
                    'attendance_date' => now()->toDateString(),
                    'status' => 'late',
                ],
            ]
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/student-attendance/bulk', $attendanceData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'attendance_date',
                        'status',
                    ],
                ],
                'message',
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_teacher_can_view_attendance_summary(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $student = User::factory()->create();
        $student->assignRole('Student');
        
        $studentProfile = Student::factory()->create(['user_id' => $student->id]);
        
        $academicYear = AcademicYear::first();
        $classroom = Classroom::first();
        $section = Section::first();

        // Create some attendance records
        StudentAttendance::factory()->count(5)->create([
            'student_id' => $studentProfile->id,
            'academic_year_id' => $academicYear->id,
            'classroom_id' => $classroom->id,
            'section_id' => $section->id,
            'status' => 'present',
        ]);

        StudentAttendance::factory()->count(2)->create([
            'student_id' => $studentProfile->id,
            'academic_year_id' => $academicYear->id,
            'classroom_id' => $classroom->id,
            'section_id' => $section->id,
            'status' => 'absent',
        ]);

        $token = $teacher->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/student-attendance/summary?' . http_build_query([
            'student_id' => $studentProfile->id,
            'academic_year_id' => $academicYear->id,
        ]));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_days',
                    'present',
                    'absent',
                    'late',
                    'excused',
                    'attendance_percentage',
                ],
                'message',
            ]);

        $data = $response->json('data');
        $this->assertEquals(7, $data['total_days']);
        $this->assertEquals(5, $data['present']);
        $this->assertEquals(2, $data['absent']);
        $this->assertEquals(71.43, $data['attendance_percentage']);
    }

    public function test_unauthorized_user_cannot_mark_attendance(): void
    {
        $user = User::factory()->create();
        // Don't assign any role - user has no permissions

        $token = $user->createToken('test-token')->plainTextToken;

        $attendanceData = [
            'student_id' => 1,
            'academic_year_id' => 1,
            'classroom_id' => 1,
            'section_id' => 1,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/student-attendance', $attendanceData);

        $response->assertStatus(403);
    }
}