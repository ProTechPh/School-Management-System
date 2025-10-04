<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Fees\StoreFeeInvoiceRequest;
use App\Http\Requests\API\V1\Fees\UpdateFeeInvoiceRequest;
use App\Http\Requests\API\V1\Fees\BulkInvoiceRequest;
use App\Http\Resources\API\V1\FeeInvoiceResource;
use App\Models\FeeInvoice;
use App\Services\Fees\FeeInvoiceService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FeeInvoiceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly FeeInvoiceService $feeInvoiceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeeInvoice::class);

        $invoices = $this->feeInvoiceService->getFeeInvoices($request->all());

        return response()->json([
            'data' => FeeInvoiceResource::collection($invoices),
            'message' => 'Fee invoices retrieved successfully',
        ]);
    }

    public function store(StoreFeeInvoiceRequest $request): JsonResponse
    {
        $this->authorize('create', FeeInvoice::class);

        try {
            $invoice = $this->feeInvoiceService->createFeeInvoice($request->validated());

            return response()->json([
                'data' => new FeeInvoiceResource($invoice->load([
                    'student.user',
                    'feeStructure',
                    'academicYear',
                    'createdBy.user'
                ])),
                'message' => 'Fee invoice created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function bulkStore(BulkInvoiceRequest $request): JsonResponse
    {
        $this->authorize('create', FeeInvoice::class);

        try {
            $invoices = $this->feeInvoiceService->generateBulkInvoices(
                $request->validated()['student_ids'],
                $request->validated()['fee_structure_id'],
                $request->validated()['academic_year_id']
            );

            return response()->json([
                'data' => FeeInvoiceResource::collection($invoices),
                'message' => 'Bulk invoices created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(FeeInvoice $feeInvoice): JsonResponse
    {
        $this->authorize('view', $feeInvoice);

        return response()->json([
            'data' => new FeeInvoiceResource($feeInvoice->load([
                'student.user',
                'feeStructure',
                'academicYear',
                'createdBy.user',
                'payments.receivedBy.user'
            ])),
            'message' => 'Fee invoice retrieved successfully',
        ]);
    }

    public function update(UpdateFeeInvoiceRequest $request, FeeInvoice $feeInvoice): JsonResponse
    {
        $this->authorize('update', $feeInvoice);

        try {
            $invoice = $this->feeInvoiceService->updateFeeInvoice($feeInvoice, $request->validated());

            return response()->json([
                'data' => new FeeInvoiceResource($invoice),
                'message' => 'Fee invoice updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(FeeInvoice $feeInvoice): JsonResponse
    {
        $this->authorize('delete', $feeInvoice);

        $this->feeInvoiceService->deleteFeeInvoice($feeInvoice);

        return response()->json([
            'message' => 'Fee invoice deleted successfully',
        ]);
    }

    public function studentSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeeInvoice::class);

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $summary = $this->feeInvoiceService->getStudentFeeSummary(
            (int) $request->student_id,
            (int) $request->academic_year_id
        );

        return response()->json([
            'data' => $summary,
            'message' => 'Student fee summary retrieved successfully',
        ]);
    }

    public function classSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeeInvoice::class);

        $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $summary = $this->feeInvoiceService->getClassFeeSummary(
            (int) $request->classroom_id,
            (int) $request->academic_year_id
        );

        return response()->json([
            'data' => $summary,
            'message' => 'Class fee summary retrieved successfully',
        ]);
    }
}
