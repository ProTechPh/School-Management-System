<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class TransportStop extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'pickup_time',
        'drop_time',
        'landmarks',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'pickup_time' => 'datetime:H:i:s',
            'drop_time' => 'datetime:H:i:s',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function routes(): BelongsToMany
    {
        return $this->belongsToMany(TransportRoute::class, 'transport_route_stops')
            ->withPivot(['sequence_order', 'arrival_time', 'departure_time', 'distance_from_previous'])
            ->orderBy('sequence_order');
    }

    public function routeStops(): HasMany
    {
        return $this->hasMany(TransportRouteStop::class);
    }

    public function pickupAssignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class, 'pickup_stop_id');
    }

    public function dropAssignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class, 'drop_stop_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'address', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
