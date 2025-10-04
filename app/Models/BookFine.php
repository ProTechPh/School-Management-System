<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class BookFine extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_loan_id',
        'student_id',
        'amount',
        'fine_type', // 'overdue', 'damage', 'loss'
        'description',
        'due_date',
        'paid_date',
        'paid_amount',
        'status', // 'pending', 'paid', 'waived', 'cancelled'
        'waived_by',
        'waived_reason',
        'collected_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_date' => 'date',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['amount', 'fine_type', 'status', 'paid_amount'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function bookLoan(): BelongsTo
    {
        return $this->belongsTo(BookLoan::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function waivedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'waived_by');
    }

    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'collected_by');
    }

    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_date < now()->toDateString();
    }

    public function getRemainingAmount(): float
    {
        return $this->amount - $this->paid_amount;
    }
}

