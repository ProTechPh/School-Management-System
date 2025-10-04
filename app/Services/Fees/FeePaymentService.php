<?php

declare(strict_types=1);

namespace App\Services\Fees;

use App\Models\FeePayment;
use App\Models\FeeLedger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class FeePaymentService
{
    public function getFeePayments(array $filters = []): LengthAwarePaginator
    {
        $query = FeePayment::with([
            'feeInvoice',
            'student.user',
            'receivedBy.user'
        ]);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['fee_invoice_id'])) {
            $query->where('fee_invoice_id', $filters['fee_invoice_id']);
        }

        if (isset($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->where('payment_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('payment_date', '<=', $filters['date_to']);
        }

        return $query->orderBy('payment_date', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function createFeePayment(array $data): FeePayment
    {
        return DB::transaction(function () use ($data) {
            $payment = FeePayment::create($data);

            // Update invoice balance
            $invoice = $payment->feeInvoice;
            $invoice->updateBalance();

            // Create ledger entry
            $this->createLedgerEntry($payment);

            return $payment;
        });
    }

    public function updateFeePayment(FeePayment $payment, array $data): FeePayment
    {
        return DB::transaction(function () use ($payment, $data) {
            $oldAmount = $payment->amount;
            $payment->update($data);

            // If amount changed, update invoice balance and create adjustment
            if (isset($data['amount']) && $data['amount'] != $oldAmount) {
                $difference = $data['amount'] - $oldAmount;
                
                // Update invoice balance
                $invoice = $payment->feeInvoice;
                $invoice->updateBalance();

                // Create adjustment ledger entry if amount changed
                if ($difference != 0) {
                    $this->createLedgerEntry(
                        $payment,
                        'adjustment',
                        $difference < 0 ? abs($difference) : 0,
                        $difference > 0 ? $difference : 0,
                        'Payment amount adjusted'
                    );
                }
            }

            return $payment->fresh();
        });
    }

    public function confirmPayment(FeePayment $payment): FeePayment
    {
        return DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'confirmed']);
            
            // Update invoice balance
            $payment->feeInvoice->updateBalance();

            return $payment;
        });
    }

    public function cancelPayment(FeePayment $payment): FeePayment
    {
        return DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'cancelled']);
            
            // Create reversal ledger entry
            $this->createLedgerEntry(
                $payment,
                'refund',
                0,
                $payment->amount,
                'Payment cancelled'
            );

            // Update invoice balance
            $payment->feeInvoice->updateBalance();

            return $payment;
        });
    }

    public function getPaymentSummary(array $filters = []): array
    {
        $query = FeePayment::query();

        if (isset($filters['date_from'])) {
            $query->where('payment_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('payment_date', '<=', $filters['date_to']);
        }

        if (isset($filters['academic_year_id'])) {
            $query->whereHas('student.enrollments', function ($q) use ($filters) {
                $q->where('academic_year_id', $filters['academic_year_id']);
            });
        }

        $payments = $query->get();

        $summary = [
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('amount'),
            'confirmed_payments' => $payments->where('status', 'confirmed')->count(),
            'pending_payments' => $payments->where('status', 'pending')->count(),
            'cancelled_payments' => $payments->where('status', 'cancelled')->count(),
            'by_method' => $payments->groupBy('payment_method')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('amount'),
                ];
            }),
            'by_date' => $payments->groupBy('payment_date')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('amount'),
                ];
            }),
        ];

        return $summary;
    }

    public function deleteFeePayment(FeePayment $payment): void
    {
        DB::transaction(function () use ($payment) {
            // Create reversal ledger entry
            $this->createLedgerEntry(
                $payment,
                'refund',
                0,
                $payment->amount,
                'Payment deleted'
            );

            // Update invoice balance
            $payment->feeInvoice->updateBalance();

            $payment->delete();
        });
    }

    private function createLedgerEntry(
        FeePayment $payment,
        string $transactionType = 'payment',
        float $debitAmount = 0,
        float $creditAmount = 0,
        string $description = null
    ): void {
        $lastBalance = FeeLedger::where('student_id', $payment->student_id)
            ->where('academic_year_id', $payment->feeInvoice->academic_year_id)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->value('balance') ?? 0;

        $newBalance = $lastBalance + $debitAmount - $creditAmount;

        FeeLedger::create([
            'student_id' => $payment->student_id,
            'academic_year_id' => $payment->feeInvoice->academic_year_id,
            'transaction_date' => $payment->payment_date,
            'transaction_type' => $transactionType,
            'reference_id' => $payment->id,
            'reference_type' => FeePayment::class,
            'description' => $description ?? "Payment for invoice {$payment->feeInvoice->invoice_number}",
            'debit_amount' => $debitAmount,
            'credit_amount' => $creditAmount,
            'balance' => $newBalance,
        ]);
    }
}
