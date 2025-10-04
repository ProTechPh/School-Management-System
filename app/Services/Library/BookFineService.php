<?php

declare(strict_types=1);

namespace App\Services\Library;

use App\Models\BookFine;
use App\Models\BookLoan;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class BookFineService
{
    public function getFines(array $filters = []): LengthAwarePaginator
    {
        $query = BookFine::with(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['fine_type'])) {
            $query->where('fine_type', $filters['fine_type']);
        }

        if (isset($filters['overdue'])) {
            if ($filters['overdue']) {
                $query->where('status', 'pending')
                      ->where('due_date', '<', now()->toDateString());
            }
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    public function createFine(array $data): BookFine
    {
        return BookFine::create($data);
    }

    public function updateFine(BookFine $fine, array $data): BookFine
    {
        $fine->update($data);
        return $fine->fresh(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);
    }

    public function deleteFine(BookFine $fine): void
    {
        $fine->delete();
    }

    public function payFine(BookFine $fine, array $data): BookFine
    {
        return DB::transaction(function () use ($fine, $data): BookFine {
            $paidAmount = $data['paid_amount'];
            $newPaidAmount = $fine->paid_amount + $paidAmount;
            
            $status = 'paid';
            if ($newPaidAmount < $fine->amount) {
                $status = 'pending';
            }

            $fine->update([
                'paid_amount' => $newPaidAmount,
                'paid_date' => $data['paid_date'] ?? now()->toDateString(),
                'status' => $status,
                'collected_by' => $data['collected_by'] ?? null,
            ]);

            return $fine->fresh(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);
        });
    }

    public function waiveFine(BookFine $fine, array $data): BookFine
    {
        $fine->update([
            'status' => 'waived',
            'waived_by' => $data['waived_by'] ?? null,
            'waived_reason' => $data['waived_reason'] ?? null,
        ]);

        return $fine->fresh(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);
    }

    public function getStudentFines(int $studentId, array $filters = []): Collection
    {
        $query = BookFine::with(['bookLoan.book'])
            ->where('student_id', $studentId);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getOverdueFines(): Collection
    {
        return BookFine::with(['bookLoan.book', 'student.user'])
            ->where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    public function generateOverdueFines(): int
    {
        $overdueLoans = BookLoan::where('status', 'active')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        $finesCreated = 0;

        foreach ($overdueLoans as $loan) {
            // Check if fine already exists for this loan
            $existingFine = BookFine::where('book_loan_id', $loan->id)
                ->where('fine_type', 'overdue')
                ->where('status', 'pending')
                ->first();

            if (!$existingFine) {
                $daysOverdue = now()->diffInDays($loan->due_date);
                $fineAmount = $daysOverdue * 1.0; // $1 per day

                BookFine::create([
                    'book_loan_id' => $loan->id,
                    'student_id' => $loan->student_id,
                    'amount' => $fineAmount,
                    'fine_type' => 'overdue',
                    'description' => "Overdue fine for {$daysOverdue} days",
                    'due_date' => now()->addDays(30)->toDateString(), // 30 days to pay
                ]);

                $finesCreated++;
            }
        }

        return $finesCreated;
    }

    public function getFineStatistics(): array
    {
        $totalFines = BookFine::count();
        $pendingFines = BookFine::where('status', 'pending')->count();
        $paidFines = BookFine::where('status', 'paid')->count();
        $waivedFines = BookFine::where('status', 'waived')->count();
        $totalAmount = BookFine::sum('amount');
        $totalPaid = BookFine::sum('paid_amount');
        $totalOutstanding = $totalAmount - $totalPaid;

        return [
            'total_fines' => $totalFines,
            'pending_fines' => $pendingFines,
            'paid_fines' => $paidFines,
            'waived_fines' => $waivedFines,
            'total_amount' => $totalAmount,
            'total_paid' => $totalPaid,
            'total_outstanding' => $totalOutstanding,
        ];
    }
}
