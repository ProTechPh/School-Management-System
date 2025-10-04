<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Students\StoreStudentRequest;
use App\Http\Requests\API\V1\Students\UpdateStudentRequest;
use App\Http\Resources\API\V1\StudentResource;
use App\Models\Student;
use App\Services\Students\StudentService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentsController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly StudentService $studentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Student::class);

        $students = $this->studentService->getStudents($request->all());

        return response()->json([
            'data' => StudentResource::collection($students),
            'message' => 'Students retrieved successfully',
        ]);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $this->authorize('create', Student::class);

        $student = $this->studentService->createStudent($request->validated());

        return response()->json([
            'data' => new StudentResource($student),
            'message' => 'Student created successfully',
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        return response()->json([
            'data' => new StudentResource($student->load(['user', 'guardians', 'enrollments'])),
            'message' => 'Student retrieved successfully',
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $this->authorize('update', $student);

        $student = $this->studentService->updateStudent($student, $request->validated());

        return response()->json([
            'data' => new StudentResource($student),
            'message' => 'Student updated successfully',
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        $this->authorize('delete', $student);

        $this->studentService->deleteStudent($student);

        return response()->json(null, 204);
    }
}
