<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class TransportRouteStop extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'transport_route_id',
        'transport_stop_id',
        'sequence_order',
        'arrival_time',
        'departure_time',
        'distance_from_previous',
    ];

    protected function casts(): array
    {
        return [
            'sequence_order' => 'integer',
            'arrival_time' => 'datetime:H:i:s',
            'departure_time' => 'datetime:H:i:s',
            'distance_from_previous' => 'decimal:2',
        ];
    }

    public function transportRoute(): BelongsTo
    {
        return $this->belongsTo(TransportRoute::class);
    }

    public function transportStop(): BelongsTo
    {
        return $this->belongsTo(TransportStop::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['sequence_order', 'arrival_time', 'departure_time', 'distance_from_previous'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
