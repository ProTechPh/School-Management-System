<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

final class ExamResult extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'student_id',
        'exam_term_id',
        'exam_assessment_id',
        'subject_id',
        'marks_obtained',
        'grade',
        'grade_points',
        'remarks',
        'is_passed',
        'entered_by',
    ];

    protected function casts(): array
    {
        return [
            'marks_obtained' => 'decimal:2',
            'grade_points' => 'decimal:2',
            'is_passed' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['marks_obtained', 'grade', 'grade_points', 'is_passed', 'remarks'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function examTerm(): BelongsTo
    {
        return $this->belongsTo(ExamTerm::class);
    }

    public function examAssessment(): BelongsTo
    {
        return $this->belongsTo(ExamAssessment::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'entered_by');
    }
}
