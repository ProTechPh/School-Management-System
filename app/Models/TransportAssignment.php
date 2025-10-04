<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class TransportAssignment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'student_id',
        'transport_route_id',
        'transport_vehicle_id',
        'pickup_stop_id',
        'drop_stop_id',
        'start_date',
        'end_date',
        'monthly_fare',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'monthly_fare' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function transportRoute(): BelongsTo
    {
        return $this->belongsTo(TransportRoute::class);
    }

    public function transportVehicle(): BelongsTo
    {
        return $this->belongsTo(TransportVehicle::class);
    }

    public function pickupStop(): BelongsTo
    {
        return $this->belongsTo(TransportStop::class, 'pickup_stop_id');
    }

    public function dropStop(): BelongsTo
    {
        return $this->belongsTo(TransportStop::class, 'drop_stop_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['start_date', 'end_date', 'monthly_fare', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
