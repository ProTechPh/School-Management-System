<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class FeePayment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'fee_invoice_id',
        'student_id',
        'payment_date',
        'amount',
        'payment_method', // 'cash', 'cheque', 'bank_transfer', 'card', 'other'
        'payment_reference',
        'bank_name',
        'cheque_number',
        'transaction_id',
        'notes',
        'received_by',
        'status', // 'pending', 'confirmed', 'cancelled'
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['payment_date', 'amount', 'payment_method', 'payment_reference', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function feeInvoice(): BelongsTo
    {
        return $this->belongsTo(FeeInvoice::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'received_by');
    }
}
