<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ExamResult;
use App\Models\Student;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ExamResultTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Run seeders to create roles
        $this->seed([
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\SchoolSeeder::class,
        ]);
    }

    public function test_admin_can_view_exam_results(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/exam-results');

        $response->assertStatus(200);
    }

    public function test_teacher_can_create_exam_result(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $token = $teacher->createToken('test-token')->plainTextToken;

        $student = Student::factory()->create();
        $examTerm = \App\Models\ExamTerm::factory()->create();
        $examAssessment = \App\Models\ExamAssessment::factory()->create();
        $subject = \App\Models\Subject::factory()->create();

        $examResultData = [
            'student_id' => $student->id,
            'exam_term_id' => $examTerm->id,
            'exam_assessment_id' => $examAssessment->id,
            'subject_id' => $subject->id,
            'marks_obtained' => 85.5,
            'remarks' => 'Good performance',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/exam-results', $examResultData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'student',
                'exam_term',
                'exam_assessment',
                'subject',
                'marks_obtained',
                'grade',
                'grade_points',
                'is_passed',
                'created_at',
            ],
            'message',
        ]);
    }

    public function test_student_can_view_own_exam_results(): void
    {
        $student = Student::factory()->create();
        $studentUser = $student->user;
        $studentUser->assignRole('Student');

        $token = $studentUser->createToken('test-token')->plainTextToken;

        $examResult = ExamResult::factory()->create([
            'student_id' => $student->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/v1/exam-results/{$examResult->id}");

        $response->assertStatus(200);
    }

    public function test_unauthorized_user_cannot_view_exam_results(): void
    {
        $user = User::factory()->create();
        // Don't assign any role - user has no permissions

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/exam-results');

        $response->assertStatus(403);
    }

    public function test_teacher_can_update_exam_result(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $token = $teacher->createToken('test-token')->plainTextToken;

        $examResult = ExamResult::factory()->create();

        $updateData = [
            'marks_obtained' => 92.0,
            'remarks' => 'Excellent performance',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson("/api/v1/exam-results/{$examResult->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'marks_obtained' => 92.0,
                'remarks' => 'Excellent performance',
            ],
        ]);
    }

    public function test_bulk_exam_result_creation(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $token = $teacher->createToken('test-token')->plainTextToken;

        $student1 = Student::factory()->create();
        $student2 = Student::factory()->create();
        $examTerm = \App\Models\ExamTerm::factory()->create();
        $examAssessment = \App\Models\ExamAssessment::factory()->create();
        $subject = \App\Models\Subject::factory()->create();

        $bulkData = [
            'results' => [
                [
                    'student_id' => $student1->id,
                    'exam_term_id' => $examTerm->id,
                    'exam_assessment_id' => $examAssessment->id,
                    'subject_id' => $subject->id,
                    'marks_obtained' => 78.5,
                ],
                [
                    'student_id' => $student2->id,
                    'exam_term_id' => $examTerm->id,
                    'exam_assessment_id' => $examAssessment->id,
                    'subject_id' => $subject->id,
                    'marks_obtained' => 85.0,
                ],
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/exam-results/bulk', $bulkData);

        $response->assertStatus(201);
        $response->assertJsonCount(2, 'data');
    }

    public function test_report_card_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $student = Student::factory()->create();
        $examTerm = \App\Models\ExamTerm::factory()->create();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/exam-results/report-card?student_id=' . $student->id . '&exam_term_id=' . $examTerm->id);

        $response->assertStatus(200);
    }

    public function test_class_results_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $examAssessment = \App\Models\ExamAssessment::factory()->create();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/exam-results/class-results?exam_assessment_id=' . $examAssessment->id);

        $response->assertStatus(200);
    }
}
