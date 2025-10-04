<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Library\StoreBookLoanRequest;
use App\Http\Requests\API\V1\Library\UpdateBookLoanRequest;
use App\Http\Requests\API\V1\Library\ReturnBookLoanRequest;
use App\Http\Resources\API\V1\BookLoanResource;
use App\Models\BookLoan;
use App\Services\Library\BookLoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

final class BookLoansController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly BookLoanService $bookLoanService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BookLoan::class);

        $filters = $request->only(['student_id', 'status', 'overdue', 'date_from', 'date_to']);
        $loans = $this->bookLoanService->getLoans($filters);

        return response()->json([
            'data' => BookLoanResource::collection($loans),
            'message' => 'Book loans retrieved successfully',
        ]);
    }

    public function store(StoreBookLoanRequest $request): JsonResponse
    {
        $this->authorize('create', BookLoan::class);

        try {
            $loan = $this->bookLoanService->createLoan($request->validated());

            return response()->json([
                'data' => new BookLoanResource($loan),
                'message' => 'Book loan created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(BookLoan $bookLoan): JsonResponse
    {
        $this->authorize('view', $bookLoan);

        $bookLoan->load(['book', 'bookCopy', 'student.user', 'staff.user', 'issuedBy.user', 'returnedBy.user']);

        return response()->json([
            'data' => new BookLoanResource($bookLoan),
            'message' => 'Book loan retrieved successfully',
        ]);
    }

    public function update(UpdateBookLoanRequest $request, BookLoan $bookLoan): JsonResponse
    {
        $this->authorize('update', $bookLoan);

        try {
            $bookLoan = $this->bookLoanService->updateLoan($bookLoan, $request->validated());

            return response()->json([
                'data' => new BookLoanResource($bookLoan),
                'message' => 'Book loan updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(BookLoan $bookLoan): JsonResponse
    {
        $this->authorize('delete', $bookLoan);

        try {
            $this->bookLoanService->deleteLoan($bookLoan);

            return response()->json([
                'message' => 'Book loan deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function return(ReturnBookLoanRequest $request, BookLoan $bookLoan): JsonResponse
    {
        $this->authorize('update', $bookLoan);

        try {
            $bookLoan = $this->bookLoanService->returnBook($bookLoan, $request->validated());

            return response()->json([
                'data' => new BookLoanResource($bookLoan),
                'message' => 'Book returned successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function studentLoans(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BookLoan::class);

        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $filters = $request->only(['status']);
        $loans = $this->bookLoanService->getStudentLoans((int) $request->student_id, $filters);

        return response()->json([
            'data' => BookLoanResource::collection($loans),
            'message' => 'Student loans retrieved successfully',
        ]);
    }

    public function overdue(): JsonResponse
    {
        $this->authorize('viewAny', BookLoan::class);

        $loans = $this->bookLoanService->getOverdueLoans();

        return response()->json([
            'data' => BookLoanResource::collection($loans),
            'message' => 'Overdue loans retrieved successfully',
        ]);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', BookLoan::class);

        $statistics = $this->bookLoanService->getLoanStatistics();

        return response()->json([
            'data' => $statistics,
            'message' => 'Loan statistics retrieved successfully',
        ]);
    }
}
