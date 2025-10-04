<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class GradingScaleItem extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'grading_scale_id',
        'grade',
        'min_marks',
        'max_marks',
        'grade_points',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'min_marks' => 'decimal:2',
            'max_marks' => 'decimal:2',
            'grade_points' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['grade', 'min_marks', 'max_marks', 'grade_points'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function gradingScale(): BelongsTo
    {
        return $this->belongsTo(GradingScale::class);
    }
}
