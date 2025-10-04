<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class Notice extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'school_id',
        'title',
        'content',
        'type',
        'priority',
        'target_audience',
        'target_classes',
        'target_sections',
        'publish_date',
        'expiry_date',
        'is_published',
        'is_pinned',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'target_classes' => 'array',
            'target_sections' => 'array',
            'publish_date' => 'date',
            'expiry_date' => 'date',
            'is_published' => 'boolean',
            'is_pinned' => 'boolean',
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
            ->logOnly(['title', 'type', 'priority', 'is_published', 'is_pinned'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
