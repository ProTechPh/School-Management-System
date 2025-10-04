<?php

declare(strict_types=1);

namespace App\Services\Library;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookLoan;
use App\Models\Student;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class BookLoanService
{
    public function getLoans(array $filters = []): LengthAwarePaginator
    {
        $query = BookLoan::with(['book', 'bookCopy', 'student.user', 'staff.user', 'issuedBy.user']);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['overdue'])) {
            if ($filters['overdue']) {
                $query->where('status', 'active')
                      ->where('due_date', '<', now()->toDateString());
            }
        }

        if (isset($filters['date_from'])) {
            $query->where('loan_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('loan_date', '<=', $filters['date_to']);
        }

        return $query->orderBy('loan_date', 'desc')->paginate(15);
    }

    public function createLoan(array $data): BookLoan
    {
        return DB::transaction(function () use ($data): BookLoan {
            $bookCopy = BookCopy::findOrFail($data['book_copy_id']);
            
            if ($bookCopy->status !== 'available') {
                throw new \Exception('Book copy is not available for loan');
            }

            $loan = BookLoan::create($data);

            // Update book copy status
            $bookCopy->update(['status' => 'loaned']);

            return $loan->load(['book', 'bookCopy', 'student.user', 'staff.user', 'issuedBy.user']);
        });
    }

    public function returnBook(BookLoan $loan, array $data): BookLoan
    {
        return DB::transaction(function () use ($loan, $data): BookLoan {
            $loan->update([
                'returned_at' => now(),
                'returned_by' => $data['returned_by'] ?? null,
                'status' => 'returned',
                'notes' => $data['notes'] ?? $loan->notes,
            ]);

            // Update book copy status
            $loan->bookCopy->update(['status' => 'available']);

            return $loan->fresh(['book', 'bookCopy', 'student.user', 'staff.user', 'issuedBy.user', 'returnedBy.user']);
        });
    }

    public function updateLoan(BookLoan $loan, array $data): BookLoan
    {
        $loan->update($data);
        return $loan->fresh(['book', 'bookCopy', 'student.user', 'staff.user', 'issuedBy.user']);
    }

    public function deleteLoan(BookLoan $loan): void
    {
        DB::transaction(function () use ($loan): void {
            if ($loan->status === 'active') {
                $loan->bookCopy->update(['status' => 'available']);
            }
            $loan->delete();
        });
    }

    public function getStudentLoans(int $studentId, array $filters = []): Collection
    {
        $query = BookLoan::with(['book', 'bookCopy'])
            ->where('student_id', $studentId);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('loan_date', 'desc')->get();
    }

    public function getOverdueLoans(): Collection
    {
        return BookLoan::with(['book', 'bookCopy', 'student.user'])
            ->where('status', 'active')
            ->where('due_date', '<', now()->toDateString())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    public function calculateFine(BookLoan $loan): float
    {
        if ($loan->status !== 'active' || $loan->returned_at) {
            return 0;
        }

        $daysOverdue = max(0, now()->diffInDays($loan->due_date, false));
        return $daysOverdue * 1.0; // $1 per day overdue
    }

    public function getLoanStatistics(): array
    {
        $totalLoans = BookLoan::count();
        $activeLoans = BookLoan::where('status', 'active')->count();
        $overdueLoans = BookLoan::where('status', 'active')
            ->where('due_date', '<', now()->toDateString())
            ->count();
        $returnedLoans = BookLoan::where('status', 'returned')->count();

        return [
            'total_loans' => $totalLoans,
            'active_loans' => $activeLoans,
            'overdue_loans' => $overdueLoans,
            'returned_loans' => $returnedLoans,
        ];
    }
}
