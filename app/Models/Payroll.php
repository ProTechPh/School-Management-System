<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class Payroll extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'staff_id',
        'school_id',
        'pay_period',
        'pay_date',
        'basic_salary',
        'allowances',
        'overtime',
        'bonus',
        'deductions',
        'tax',
        'net_salary',
        'status',
        'notes',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'pay_date' => 'date',
            'basic_salary' => 'decimal:2',
            'allowances' => 'decimal:2',
            'overtime' => 'decimal:2',
            'bonus' => 'decimal:2',
            'deductions' => 'decimal:2',
            'tax' => 'decimal:2',
            'net_salary' => 'decimal:2',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'processed_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['pay_period', 'net_salary', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
