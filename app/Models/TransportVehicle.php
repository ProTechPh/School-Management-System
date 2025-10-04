<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class TransportVehicle extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'vehicle_number',
        'vehicle_type',
        'make',
        'model',
        'year',
        'color',
        'capacity',
        'driver_name',
        'driver_phone',
        'driver_license',
        'insurance_expiry',
        'registration_expiry',
        'fitness_expiry',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'capacity' => 'integer',
            'insurance_expiry' => 'date',
            'registration_expiry' => 'date',
            'fitness_expiry' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TransportAssignment::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['vehicle_number', 'vehicle_type', 'driver_name', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
