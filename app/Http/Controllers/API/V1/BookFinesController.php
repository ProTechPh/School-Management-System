<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Library\StoreBookFineRequest;
use App\Http\Requests\API\V1\Library\UpdateBookFineRequest;
use App\Http\Requests\API\V1\Library\PayBookFineRequest;
use App\Http\Requests\API\V1\Library\WaiveBookFineRequest;
use App\Http\Resources\API\V1\BookFineResource;
use App\Models\BookFine;
use App\Services\Library\BookFineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

final class BookFinesController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly BookFineService $bookFineService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BookFine::class);

        $filters = $request->only(['student_id', 'status', 'fine_type', 'overdue']);
        $fines = $this->bookFineService->getFines($filters);

        return response()->json([
            'data' => BookFineResource::collection($fines),
            'message' => 'Book fines retrieved successfully',
        ]);
    }

    public function store(StoreBookFineRequest $request): JsonResponse
    {
        $this->authorize('create', BookFine::class);

        try {
            $fine = $this->bookFineService->createFine($request->validated());
            $fine->load(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);

            return response()->json([
                'data' => new BookFineResource($fine),
                'message' => 'Book fine created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(BookFine $bookFine): JsonResponse
    {
        $this->authorize('view', $bookFine);

        $bookFine->load(['bookLoan.book', 'student.user', 'waivedBy.user', 'collectedBy.user']);

        return response()->json([
            'data' => new BookFineResource($bookFine),
            'message' => 'Book fine retrieved successfully',
        ]);
    }

    public function update(UpdateBookFineRequest $request, BookFine $bookFine): JsonResponse
    {
        $this->authorize('update', $bookFine);

        try {
            $bookFine = $this->bookFineService->updateFine($bookFine, $request->validated());

            return response()->json([
                'data' => new BookFineResource($bookFine),
                'message' => 'Book fine updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(BookFine $bookFine): JsonResponse
    {
        $this->authorize('delete', $bookFine);

        try {
            $this->bookFineService->deleteFine($bookFine);

            return response()->json([
                'message' => 'Book fine deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function pay(PayBookFineRequest $request, BookFine $bookFine): JsonResponse
    {
        $this->authorize('update', $bookFine);

        try {
            $bookFine = $this->bookFineService->payFine($bookFine, $request->validated());

            return response()->json([
                'data' => new BookFineResource($bookFine),
                'message' => 'Fine payment processed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function waive(WaiveBookFineRequest $request, BookFine $bookFine): JsonResponse
    {
        $this->authorize('update', $bookFine);

        try {
            $bookFine = $this->bookFineService->waiveFine($bookFine, $request->validated());

            return response()->json([
                'data' => new BookFineResource($bookFine),
                'message' => 'Fine waived successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function studentFines(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BookFine::class);

        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $filters = $request->only(['status']);
        $fines = $this->bookFineService->getStudentFines((int) $request->student_id, $filters);

        return response()->json([
            'data' => BookFineResource::collection($fines),
            'message' => 'Student fines retrieved successfully',
        ]);
    }

    public function overdue(): JsonResponse
    {
        $this->authorize('viewAny', BookFine::class);

        $fines = $this->bookFineService->getOverdueFines();

        return response()->json([
            'data' => BookFineResource::collection($fines),
            'message' => 'Overdue fines retrieved successfully',
        ]);
    }

    public function generateOverdue(): JsonResponse
    {
        $this->authorize('create', BookFine::class);

        try {
            $finesCreated = $this->bookFineService->generateOverdueFines();

            return response()->json([
                'data' => ['fines_created' => $finesCreated],
                'message' => "Generated {$finesCreated} overdue fines",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', BookFine::class);

        $statistics = $this->bookFineService->getFineStatistics();

        return response()->json([
            'data' => $statistics,
            'message' => 'Fine statistics retrieved successfully',
        ]);
    }
}
