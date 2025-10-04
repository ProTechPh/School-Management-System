<?php

declare(strict_types=1);

namespace App\Services\Attendance;

use App\Models\StaffAttendance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class StaffAttendanceService
{
    public function getStaffAttendance(array $filters = []): LengthAwarePaginator
    {
        $query = StaffAttendance::with([
            'staff.user',
            'markedBy.user'
        ]);

        if (isset($filters['staff_id'])) {
            $query->where('staff_id', $filters['staff_id']);
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

    public function markAttendance(array $data): StaffAttendance
    {
        return DB::transaction(function () use ($data) {
            // Check if attendance already exists for this staff/date
            $existing = StaffAttendance::where('staff_id', $data['staff_id'])
                ->whereDate('attendance_date', $data['attendance_date'])
                ->first();

            if ($existing) {
                // Update existing attendance
                $existing->update([
                    'check_in_time' => $data['check_in_time'] ?? null,
                    'check_out_time' => $data['check_out_time'] ?? null,
                    'status' => $data['status'],
                    'remarks' => $data['remarks'] ?? null,
                    'marked_by' => $data['marked_by'] ?? null,
                ]);
                return $existing;
            }

            // Create new attendance record
            return StaffAttendance::create($data);
        });
    }

    public function checkIn(int $staffId, ?string $checkInTime = null): StaffAttendance
    {
        $today = now()->toDateString();
        $checkInTime = $checkInTime ?: now()->toTimeString();

        return $this->markAttendance([
            'staff_id' => $staffId,
            'attendance_date' => $today,
            'check_in_time' => $checkInTime,
            'status' => 'present',
        ]);
    }

    public function checkOut(int $staffId, ?string $checkOutTime = null): StaffAttendance
    {
        $today = now()->toDateString();
        $checkOutTime = $checkOutTime ?: now()->toTimeString();

        $attendance = StaffAttendance::where('staff_id', $staffId)
            ->whereDate('attendance_date', $today)
            ->first();

        if (!$attendance) {
            throw new \Exception('No check-in record found for today');
        }

        $attendance->update([
            'check_out_time' => $checkOutTime,
        ]);

        return $attendance->fresh();
    }

    public function getAttendanceSummary(int $staffId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = StaffAttendance::where('staff_id', $staffId);

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
        $halfDay = $attendance->where('status', 'half_day')->count();
        $onLeave = $attendance->where('status', 'on_leave')->count();

        $attendancePercentage = $totalDays > 0 ? round(($present / $totalDays) * 100, 2) : 0;

        return [
            'total_days' => $totalDays,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'half_day' => $halfDay,
            'on_leave' => $onLeave,
            'attendance_percentage' => $attendancePercentage,
        ];
    }

    public function updateAttendance(StaffAttendance $attendance, array $data): StaffAttendance
    {
        return DB::transaction(function () use ($attendance, $data) {
            $attendance->update($data);
            return $attendance->fresh();
        });
    }

    public function deleteAttendance(StaffAttendance $attendance): void
    {
        $attendance->delete();
    }
}
