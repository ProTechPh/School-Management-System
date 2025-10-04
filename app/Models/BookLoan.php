<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class BookLoan extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_id',
        'book_copy_id',
        'student_id',
        'staff_id',
        'loan_date',
        'due_date',
        'returned_at',
        'returned_by',
        'fine_amount',
        'fine_paid',
        'status', // 'active', 'returned', 'overdue', 'lost'
        'notes',
        'issued_by',
    ];

    protected function casts(): array
    {
        return [
            'loan_date' => 'date',
            'due_date' => 'date',
            'returned_at' => 'datetime',
            'fine_amount' => 'decimal:2',
            'fine_paid' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['loan_date', 'due_date', 'returned_at', 'fine_amount', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function bookCopy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'returned_by');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'issued_by');
    }

    public function isOverdue(): bool
    {
        return $this->status === 'active' && $this->due_date < now()->toDateString();
    }

    public function calculateFine(int $daysOverdue = null): float
    {
        if ($this->status !== 'active' || $this->returned_at) {
            return 0;
        }

        $daysOverdue = $daysOverdue ?? max(0, now()->diffInDays($this->due_date, false));
        
        // Simple fine calculation: $1 per day overdue
        return $daysOverdue * 1.0;
    }
}

