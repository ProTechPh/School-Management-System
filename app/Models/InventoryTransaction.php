<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class InventoryTransaction extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'inventory_item_id',
        'school_id',
        'supplier_id',
        'transaction_type',
        'quantity',
        'unit_price',
        'total_amount',
        'reference_number',
        'transaction_date',
        'notes',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'transaction_date' => 'date',
        ];
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'processed_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['transaction_type', 'quantity', 'unit_price', 'total_amount', 'transaction_date'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
