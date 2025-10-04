<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class Event extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'title',
        'description',
        'type',
        'event_date',
        'start_time',
        'end_time',
        'location',
        'target_audience',
        'target_classes',
        'target_sections',
        'is_all_day',
        'is_recurring',
        'recurrence_type',
        'recurrence_pattern',
        'recurrence_end_date',
        'is_published',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_time' => 'datetime:H:i:s',
            'end_time' => 'datetime:H:i:s',
            'target_classes' => 'array',
            'target_sections' => 'array',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'array',
            'recurrence_end_date' => 'date',
            'is_published' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'created_by');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'type', 'event_date', 'is_published', 'is_recurring'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
