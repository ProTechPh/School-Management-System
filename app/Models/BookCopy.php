<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class BookCopy extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'book_id',
        'copy_number',
        'barcode',
        'purchase_date',
        'purchase_price',
        'condition', // 'new', 'good', 'fair', 'poor', 'damaged'
        'location',
        'status', // 'available', 'loaned', 'lost', 'damaged', 'withdrawn'
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'purchase_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['copy_number', 'barcode', 'condition', 'status', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(BookLoan::class);
    }

    public function currentLoan(): HasMany
    {
        return $this->hasMany(BookLoan::class)->whereNull('returned_at');
    }
}

