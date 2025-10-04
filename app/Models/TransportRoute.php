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

final class TransportRoute extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'description',
        'distance_km',
        'estimated_duration',
        'fare_amount',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'distance_km' => 'decimal:2',
            'estimated_duration' => 'datetime:H:i:s',
            'fare_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function stops(): BelongsToMany
    {
        return $this->belongsToMany(TransportStop::class, 'transport_route_stops')
            ->withPivot(['sequence_order', 'arrival_time', 'departure_time', 'distance_from_previous'])
            ->orderBy('sequence_order');
    }

    public function routeStops(): HasMany
    {
        return $this->hasMany(TransportRouteStop::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'code', 'fare_amount', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
