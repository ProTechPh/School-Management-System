<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Exams\StoreExamResultRequest;
use App\Http\Requests\API\V1\Exams\UpdateExamResultRequest;
use App\Http\Requests\API\V1\Exams\BulkExamResultRequest;
use App\Http\Resources\API\V1\ExamResultResource;
use App\Models\ExamResult;
use App\Services\Exams\ExamResultService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ExamResultController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ExamResultService $examResultService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExamResult::class);

        $results = $this->examResultService->getExamResults($request->all());

        return response()->json([
            'data' => ExamResultResource::collection($results),
            'message' => 'Exam results retrieved successfully',
        ]);
    }

    public function store(StoreExamResultRequest $request): JsonResponse
    {
        $this->authorize('create', ExamResult::class);

        try {
            $result = $this->examResultService->createExamResult($request->validated());
            $result->load(['student.user', 'examTerm', 'examAssessment', 'subject', 'enteredBy.user']);

            return response()->json([
                'data' => new ExamResultResource($result),
                'message' => 'Exam result created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function bulkStore(BulkExamResultRequest $request): JsonResponse
    {
        $this->authorize('create', ExamResult::class);

        try {
            $results = $this->examResultService->bulkCreateExamResults($request->validated()['results']);

            return response()->json([
                'data' => ExamResultResource::collection($results),
                'message' => 'Bulk exam results created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(ExamResult $examResult): JsonResponse
    {
        $this->authorize('view', $examResult);

        return response()->json([
            'data' => new ExamResultResource($examResult->load([
                'student.user',
                'examTerm',
                'examAssessment',
                'subject',
                'enteredBy.user'
            ])),
            'message' => 'Exam result retrieved successfully',
        ]);
    }

    public function update(UpdateExamResultRequest $request, ExamResult $examResult): JsonResponse
    {
        $this->authorize('update', $examResult);

        try {
            $result = $this->examResultService->updateExamResult($examResult, $request->validated());

            return response()->json([
                'data' => new ExamResultResource($result),
                'message' => 'Exam result updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(ExamResult $examResult): JsonResponse
    {
        $this->authorize('delete', $examResult);

        $this->examResultService->deleteExamResult($examResult);

        return response()->json([
            'message' => 'Exam result deleted successfully',
        ]);
    }

    public function reportCard(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExamResult::class);

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'exam_term_id' => 'required|exists:exam_terms,id',
        ]);

        $reportCard = $this->examResultService->getStudentReportCard(
            (int) $request->student_id,
            (int) $request->exam_term_id
        );

        return response()->json([
            'data' => $reportCard,
            'message' => 'Report card retrieved successfully',
        ]);
    }

    public function classResults(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExamResult::class);

        $request->validate([
            'exam_assessment_id' => 'required|exists:exam_assessments,id',
        ]);

        $classResults = $this->examResultService->getClassResults((int) $request->exam_assessment_id);

        return response()->json([
            'data' => $classResults,
            'message' => 'Class results retrieved successfully',
        ]);
    }
}
