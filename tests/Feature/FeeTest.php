<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class FeeTest extends TestCase
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

    public function test_accountant_can_view_fee_invoices(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole('Accountant');

        $token = $accountant->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/fee-invoices');

        $response->assertStatus(200);
    }

    public function test_accountant_can_create_fee_invoice(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole('Accountant');

        $token = $accountant->createToken('test-token')->plainTextToken;

        $student = Student::factory()->create();
        $feeStructure = \App\Models\FeeStructure::factory()->create();
        $academicYear = \App\Models\AcademicYear::factory()->create();

        $invoiceData = [
            'student_id' => $student->id,
            'fee_structure_id' => $feeStructure->id,
            'academic_year_id' => $academicYear->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addMonths(1)->toDateString(),
            'total_amount' => 1500.00,
            'notes' => 'Tuition fee for current term',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/fee-invoices', $invoiceData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'student',
                'fee_structure',
                'academic_year',
                'invoice_number',
                'invoice_date',
                'due_date',
                'total_amount',
                'paid_amount',
                'balance_amount',
                'status',
                'created_at',
            ],
            'message',
        ]);
    }

    public function test_student_can_view_own_fee_invoices(): void
    {
        $student = Student::factory()->create();
        $studentUser = $student->user;
        $studentUser->assignRole('Student');

        $token = $studentUser->createToken('test-token')->plainTextToken;

        $feeInvoice = FeeInvoice::factory()->create([
            'student_id' => $student->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/v1/fee-invoices/{$feeInvoice->id}");

        $response->assertStatus(200);
    }

    public function test_accountant_can_create_fee_payment(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole('Accountant');

        $token = $accountant->createToken('test-token')->plainTextToken;

        $feeInvoice = FeeInvoice::factory()->create();
        $staff = \App\Models\Staff::factory()->create();

        $paymentData = [
            'fee_invoice_id' => $feeInvoice->id,
            'student_id' => $feeInvoice->student_id,
            'payment_date' => now()->toDateString(),
            'amount' => 500.00,
            'payment_method' => 'cash',
            'notes' => 'Partial payment',
            'received_by' => $staff->id,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/fee-payments', $paymentData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'fee_invoice',
                'student',
                'payment_date',
                'amount',
                'payment_method',
                'status',
                'created_at',
            ],
            'message',
        ]);
    }

    public function test_bulk_invoice_creation(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole('Accountant');

        $token = $accountant->createToken('test-token')->plainTextToken;

        $student1 = Student::factory()->create();
        $student2 = Student::factory()->create();
        $feeStructure = \App\Models\FeeStructure::factory()->create();
        $academicYear = \App\Models\AcademicYear::factory()->create();

        $bulkData = [
            'student_ids' => [$student1->id, $student2->id],
            'fee_structure_id' => $feeStructure->id,
            'academic_year_id' => $academicYear->id,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/fee-invoices/bulk', $bulkData);

        $response->assertStatus(201);
        $response->assertJsonCount(2, 'data');
    }

    public function test_student_fee_summary(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $student = Student::factory()->create();
        $academicYear = \App\Models\AcademicYear::factory()->create();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/fee-invoices/student-summary?student_id=' . $student->id . '&academic_year_id=' . $academicYear->id);

        $response->assertStatus(200);
    }

    public function test_payment_confirmation(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole('Accountant');

        $token = $accountant->createToken('test-token')->plainTextToken;

        $feePayment = FeePayment::factory()->create(['status' => 'pending']);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/v1/fee-payments/{$feePayment->id}/confirm");

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'status' => 'confirmed',
            ],
        ]);
    }

    public function test_unauthorized_user_cannot_view_fees(): void
    {
        $user = User::factory()->create();
        // Don't assign any role - user has no permissions

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/fee-invoices');

        $response->assertStatus(403);
    }
}
