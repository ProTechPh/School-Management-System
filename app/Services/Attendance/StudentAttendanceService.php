<?php

declare(strict_types=1);

namespace App\Services\Attendance;

use App\Models\StudentAttendance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class StudentAttendanceService
{
    public function getStudentAttendance(array $filters = []): LengthAwarePaginator
    {
        $query = StudentAttendance::with([
            'student.user',
            'academicYear',
            'classroom',
            'section',
            'subject',
            'markedBy.user'
        ]);

        if (isset($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (isset($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (isset($filters['classroom_id'])) {
            $query->where('classroom_id', $filters['classroom_id']);
        }

        if (isset($filters['section_id'])) {
            $query->where('section_id', $filters['section_id']);
        }

        if (isset($filters['attendance_date'])) {
            $query->whereDate('attendance_date', $filters['attendance_date']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('attendance_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('attendance_date', '<=', $filters['date_to']);
        }

        return $query->orderBy('attendance_date', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function markAttendance(array $data): StudentAttendance
    {
        return DB::transaction(function () use ($data) {
            // Check if attendance already exists for this student/date/period
            $existing = StudentAttendance::where('student_id', $data['student_id'])
                ->whereDate('attendance_date', $data['attendance_date'])
                ->where('period', $data['period'] ?? null)
                ->first();

            if ($existing) {
                // Update existing attendance
                $existing->update([
                    'status' => $data['status'],
                    'remarks' => $data['remarks'] ?? null,
                    'marked_by' => $data['marked_by'] ?? null,
                ]);
                return $existing;
            }

            // Create new attendance record
            return StudentAttendance::create($data);
        });
    }

    public function bulkMarkAttendance(array $attendanceData): array
    {
        return DB::transaction(function () use ($attendanceData) {
            $results = [];
            
            foreach ($attendanceData as $data) {
                $results[] = $this->markAttendance($data);
            }
            
            return $results;
        });
    }

    public function getAttendanceSummary(int $studentId, int $academicYearId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = StudentAttendance::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId);

        if ($dateFrom) {
            $query->whereDate('attendance_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('attendance_date', '<=', $dateTo);
        }

        $attendance = $query->get();

        $totalDays = $attendance->count();
        $present = $attendance->where('status', 'present')->count();
        $absent = $attendance->where('status', 'absent')->count();
        $late = $attendance->where('status', 'late')->count();
        $excused = $attendance->where('status', 'excused')->count();

        $attendancePercentage = $totalDays > 0 ? round(($present / $totalDays) * 100, 2) : 0;

        return [
            'total_days' => $totalDays,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_percentage' => $attendancePercentage,
        ];
    }

    public function updateAttendance(StudentAttendance $attendance, array $data): StudentAttendance
    {
        return DB::transaction(function () use ($attendance, $data) {
            $attendance->update($data);
            return $attendance->fresh();
        });
    }

    public function deleteAttendance(StudentAttendance $attendance): void
    {
        $attendance->delete();
    }
}
