<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Attendance\StoreStudentAttendanceRequest;
use App\Http\Requests\API\V1\Attendance\UpdateStudentAttendanceRequest;
use App\Http\Requests\API\V1\Attendance\BulkStudentAttendanceRequest;
use App\Http\Resources\API\V1\StudentAttendanceResource;
use App\Models\StudentAttendance;
use App\Services\Attendance\StudentAttendanceService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentAttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly StudentAttendanceService $attendanceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StudentAttendance::class);

        $attendance = $this->attendanceService->getStudentAttendance($request->all());

        return response()->json([
            'data' => StudentAttendanceResource::collection($attendance),
            'message' => 'Student attendance retrieved successfully',
        ]);
    }

    public function store(StoreStudentAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', StudentAttendance::class);

        $attendance = $this->attendanceService->markAttendance($request->validated());

        return response()->json([
            'data' => new StudentAttendanceResource($attendance),
            'message' => 'Student attendance marked successfully',
        ], 201);
    }

    public function bulkStore(BulkStudentAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', StudentAttendance::class);

        $attendance = $this->attendanceService->bulkMarkAttendance($request->validated()['attendance']);

        return response()->json([
            'data' => StudentAttendanceResource::collection($attendance),
            'message' => 'Bulk student attendance marked successfully',
        ], 201);
    }

    public function show(StudentAttendance $studentAttendance): JsonResponse
    {
        $this->authorize('view', $studentAttendance);

        return response()->json([
            'data' => new StudentAttendanceResource($studentAttendance->load([
                'student.user',
                'academicYear',
                'classroom',
                'section',
                'subject',
                'markedBy.user'
            ])),
            'message' => 'Student attendance retrieved successfully',
        ]);
    }

    public function update(UpdateStudentAttendanceRequest $request, StudentAttendance $studentAttendance): JsonResponse
    {
        $this->authorize('update', $studentAttendance);

        $attendance = $this->attendanceService->updateAttendance($studentAttendance, $request->validated());

        return response()->json([
            'data' => new StudentAttendanceResource($attendance),
            'message' => 'Student attendance updated successfully',
        ]);
    }

    public function destroy(StudentAttendance $studentAttendance): JsonResponse
    {
        $this->authorize('delete', $studentAttendance);

        $this->attendanceService->deleteAttendance($studentAttendance);

        return response()->json([
            'message' => 'Student attendance deleted successfully',
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StudentAttendance::class);

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $summary = $this->attendanceService->getAttendanceSummary(
            $request->student_id,
            $request->academic_year_id,
            $request->date_from,
            $request->date_to
        );

        return response()->json([
            'data' => $summary,
            'message' => 'Attendance summary retrieved successfully',
        ]);
    }
}
