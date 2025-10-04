<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Attendance\StoreStaffAttendanceRequest;
use App\Http\Requests\API\V1\Attendance\UpdateStaffAttendanceRequest;
use App\Http\Resources\API\V1\StaffAttendanceResource;
use App\Models\StaffAttendance;
use App\Services\Attendance\StaffAttendanceService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StaffAttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly StaffAttendanceService $attendanceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StaffAttendance::class);

        $attendance = $this->attendanceService->getStaffAttendance($request->all());

        return response()->json([
            'data' => StaffAttendanceResource::collection($attendance),
            'message' => 'Staff attendance retrieved successfully',
        ]);
    }

    public function store(StoreStaffAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', StaffAttendance::class);

        $attendance = $this->attendanceService->markAttendance($request->validated());

        return response()->json([
            'data' => new StaffAttendanceResource($attendance),
            'message' => 'Staff attendance marked successfully',
        ], 201);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $this->authorize('create', StaffAttendance::class);

        $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'check_in_time' => 'nullable|date_format:H:i:s',
        ]);

        $attendance = $this->attendanceService->checkIn(
            $request->staff_id,
            $request->check_in_time
        );

        return response()->json([
            'data' => new StaffAttendanceResource($attendance),
            'message' => 'Check-in recorded successfully',
        ], 201);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $this->authorize('update', StaffAttendance::class);

        $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'check_out_time' => 'nullable|date_format:H:i:s',
        ]);

        try {
            $attendance = $this->attendanceService->checkOut(
                $request->staff_id,
                $request->check_out_time
            );

            return response()->json([
                'data' => new StaffAttendanceResource($attendance),
                'message' => 'Check-out recorded successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(StaffAttendance $staffAttendance): JsonResponse
    {
        $this->authorize('view', $staffAttendance);

        return response()->json([
            'data' => new StaffAttendanceResource($staffAttendance->load([
                'staff.user',
                'markedBy.user'
            ])),
            'message' => 'Staff attendance retrieved successfully',
        ]);
    }

    public function update(UpdateStaffAttendanceRequest $request, StaffAttendance $staffAttendance): JsonResponse
    {
        $this->authorize('update', $staffAttendance);

        $attendance = $this->attendanceService->updateAttendance($staffAttendance, $request->validated());

        return response()->json([
            'data' => new StaffAttendanceResource($attendance),
            'message' => 'Staff attendance updated successfully',
        ]);
    }

    public function destroy(StaffAttendance $staffAttendance): JsonResponse
    {
        $this->authorize('delete', $staffAttendance);

        $this->attendanceService->deleteAttendance($staffAttendance);

        return response()->json([
            'message' => 'Staff attendance deleted successfully',
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StaffAttendance::class);

        $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $summary = $this->attendanceService->getAttendanceSummary(
            $request->staff_id,
            $request->date_from,
            $request->date_to
        );

        return response()->json([
            'data' => $summary,
            'message' => 'Attendance summary retrieved successfully',
        ]);
    }
}
