<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class InventoryStock extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'inventory_item_id',
        'school_id',
        'current_stock',
        'reserved_stock',
        'available_stock',
        'last_updated',
    ];

    protected function casts(): array
    {
        return [
            'current_stock' => 'integer',
            'reserved_stock' => 'integer',
            'available_stock' => 'integer',
            'last_updated' => 'date',
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

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['current_stock', 'reserved_stock', 'available_stock'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
