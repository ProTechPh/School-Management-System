<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Fees\StoreFeePaymentRequest;
use App\Http\Requests\API\V1\Fees\UpdateFeePaymentRequest;
use App\Http\Resources\API\V1\FeePaymentResource;
use App\Models\FeePayment;
use App\Services\Fees\FeePaymentService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FeePaymentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly FeePaymentService $feePaymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeePayment::class);

        $payments = $this->feePaymentService->getFeePayments($request->all());

        return response()->json([
            'data' => FeePaymentResource::collection($payments),
            'message' => 'Fee payments retrieved successfully',
        ]);
    }

    public function store(StoreFeePaymentRequest $request): JsonResponse
    {
        $this->authorize('create', FeePayment::class);

        try {
            $payment = $this->feePaymentService->createFeePayment($request->validated());

            return response()->json([
                'data' => new FeePaymentResource($payment->load([
                    'feeInvoice',
                    'student.user',
                    'receivedBy.user'
                ])),
                'message' => 'Fee payment created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(FeePayment $feePayment): JsonResponse
    {
        $this->authorize('view', $feePayment);

        return response()->json([
            'data' => new FeePaymentResource($feePayment->load([
                'feeInvoice',
                'student.user',
                'receivedBy.user'
            ])),
            'message' => 'Fee payment retrieved successfully',
        ]);
    }

    public function update(UpdateFeePaymentRequest $request, FeePayment $feePayment): JsonResponse
    {
        $this->authorize('update', $feePayment);

        try {
            $payment = $this->feePaymentService->updateFeePayment($feePayment, $request->validated());

            return response()->json([
                'data' => new FeePaymentResource($payment),
                'message' => 'Fee payment updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function confirm(FeePayment $feePayment): JsonResponse
    {
        $this->authorize('update', $feePayment);

        try {
            $payment = $this->feePaymentService->confirmPayment($feePayment);

            return response()->json([
                'data' => new FeePaymentResource($payment),
                'message' => 'Payment confirmed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function cancel(FeePayment $feePayment): JsonResponse
    {
        $this->authorize('update', $feePayment);

        try {
            $payment = $this->feePaymentService->cancelPayment($feePayment);

            return response()->json([
                'data' => new FeePaymentResource($payment),
                'message' => 'Payment cancelled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeePayment::class);

        $summary = $this->feePaymentService->getPaymentSummary($request->all());

        return response()->json([
            'data' => $summary,
            'message' => 'Payment summary retrieved successfully',
        ]);
    }

    public function destroy(FeePayment $feePayment): JsonResponse
    {
        $this->authorize('delete', $feePayment);

        $this->feePaymentService->deleteFeePayment($feePayment);

        return response()->json([
            'message' => 'Fee payment deleted successfully',
        ]);
    }
}
