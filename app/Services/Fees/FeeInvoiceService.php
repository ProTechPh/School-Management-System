<?php

declare(strict_types=1);

namespace App\Services\Fees;

use App\Models\FeeInvoice;
use App\Models\FeeLedger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class FeeInvoiceService
{
    public function getFeeInvoices(array $filters = []): LengthAwarePaginator
    {
        $query = FeeInvoice::with([
            'student.user',
            'feeStructure',
            'academicYear',
            'createdBy.user',
            'payments'
        ]);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['fee_structure_id'])) {
            $query->where('fee_structure_id', $filters['fee_structure_id']);
        }

        if (isset($filters['classroom_id'])) {
            $query->whereHas('student.enrollments', function ($q) use ($filters) {
                $q->where('classroom_id', $filters['classroom_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function createFeeInvoice(array $data): FeeInvoice
    {
        return DB::transaction(function () use ($data) {
            // Generate invoice number
            $data['invoice_number'] = $this->generateInvoiceNumber();
            
            // Set balance amount initially equal to total amount
            $data['balance_amount'] = $data['total_amount'];
            $data['paid_amount'] = 0;

            $invoice = FeeInvoice::create($data);

            // Create ledger entry
            $this->createLedgerEntry($invoice, 'invoice', (float) $data['total_amount'], 0);

            return $invoice;
        });
    }

    public function updateFeeInvoice(FeeInvoice $invoice, array $data): FeeInvoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $oldAmount = $invoice->total_amount;
            $invoice->update($data);

            // If amount changed, update balance and create adjustment entry
            if (isset($data['total_amount']) && $data['total_amount'] != $oldAmount) {
                $difference = $data['total_amount'] - $oldAmount;
                $invoice->balance_amount += $difference;
                $invoice->save();

                // Create adjustment ledger entry
                $this->createLedgerEntry(
                    $invoice,
                    'adjustment',
                    $difference > 0 ? (float) $difference : 0,
                    $difference < 0 ? (float) abs($difference) : 0,
                    'Invoice amount adjusted'
                );
            }

            return $invoice->fresh();
        });
    }

    public function generateBulkInvoices(array $studentIds, int $feeStructureId, int $academicYearId): array
    {
        return DB::transaction(function () use ($studentIds, $feeStructureId, $academicYearId) {
            $feeStructure = \App\Models\FeeStructure::find($feeStructureId);
            $invoices = [];

            foreach ($studentIds as $studentId) {
                // Check if invoice already exists for this student and fee structure
                $existingInvoice = FeeInvoice::where('student_id', $studentId)
                    ->where('fee_structure_id', $feeStructureId)
                    ->where('academic_year_id', $academicYearId)
                    ->first();

                if (!$existingInvoice) {
                    $invoiceData = [
                        'student_id' => $studentId,
                        'fee_structure_id' => $feeStructureId,
                        'academic_year_id' => $academicYearId,
                        'invoice_date' => now()->toDateString(),
                        'due_date' => $feeStructure->due_date,
                        'total_amount' => $feeStructure->amount,
                        'notes' => 'Bulk generated invoice',
                    ];

                    $invoices[] = $this->createFeeInvoice($invoiceData);
                }
            }

            return $invoices;
        });
    }

    public function getStudentFeeSummary(int $studentId, int $academicYearId): array
    {
        $invoices = FeeInvoice::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->with(['feeStructure', 'payments'])
            ->get();

        $summary = [
            'total_invoices' => $invoices->count(),
            'total_amount' => $invoices->sum('total_amount'),
            'total_paid' => $invoices->sum('paid_amount'),
            'total_balance' => $invoices->sum('balance_amount'),
            'pending_invoices' => $invoices->where('status', 'pending')->count(),
            'overdue_invoices' => $invoices->where('status', 'overdue')->count(),
            'paid_invoices' => $invoices->where('status', 'paid')->count(),
            'invoices' => $invoices,
        ];

        return $summary;
    }

    public function getClassFeeSummary(int $classroomId, int $academicYearId): array
    {
        $invoices = FeeInvoice::whereHas('student.enrollments', function ($q) use ($classroomId, $academicYearId) {
            $q->where('classroom_id', $classroomId)
              ->where('academic_year_id', $academicYearId);
        })
        ->with(['student.user', 'feeStructure'])
        ->get();

        $summary = [
            'total_students' => $invoices->groupBy('student_id')->count(),
            'total_invoices' => $invoices->count(),
            'total_amount' => $invoices->sum('total_amount'),
            'total_paid' => $invoices->sum('paid_amount'),
            'total_balance' => $invoices->sum('balance_amount'),
            'collection_rate' => $invoices->sum('total_amount') > 0 
                ? round(($invoices->sum('paid_amount') / $invoices->sum('total_amount')) * 100, 2) 
                : 0,
            'invoices' => $invoices,
        ];

        return $summary;
    }

    public function deleteFeeInvoice(FeeInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            // Create reversal ledger entry
            $this->createLedgerEntry(
                $invoice,
                'adjustment',
                0,
                (float) $invoice->total_amount,
                'Invoice cancelled'
            );

            $invoice->delete();
        });
    }

    private function generateInvoiceNumber(): string
    {
        $year = now()->year;
        $month = now()->format('m');
        $prefix = "INV-{$year}{$month}";
        
        $lastInvoice = FeeInvoice::where('invoice_number', 'like', "{$prefix}%")
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad((string) $newNumber, 4, '0', STR_PAD_LEFT);
    }

    private function createLedgerEntry(
        FeeInvoice $invoice,
        string $transactionType,
        float $debitAmount,
        float $creditAmount,
        string $description = null
    ): void {
        $lastBalance = FeeLedger::where('student_id', $invoice->student_id)
            ->where('academic_year_id', $invoice->academic_year_id)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->value('balance') ?? 0;

        $newBalance = $lastBalance + $debitAmount - $creditAmount;

        FeeLedger::create([
            'student_id' => $invoice->student_id,
            'academic_year_id' => $invoice->academic_year_id,
            'transaction_date' => now()->toDateString(),
            'transaction_type' => $transactionType,
            'reference_id' => $invoice->id,
            'reference_type' => FeeInvoice::class,
            'description' => $description ?? "Invoice {$invoice->invoice_number}",
            'debit_amount' => $debitAmount,
            'credit_amount' => $creditAmount,
            'balance' => $newBalance,
        ]);
    }
}
