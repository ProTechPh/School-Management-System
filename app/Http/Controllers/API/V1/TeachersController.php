<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\StaffResource;
use App\Models\Staff;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TeachersController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Staff::class);

        $teachers = Staff::with(['user', 'department', 'designation'])
            ->whereHas('user', function ($query) {
                $query->where('is_active', true);
            })
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => StaffResource::collection($teachers),
            'message' => 'Teachers retrieved successfully',
        ]);
    }

    public function show(Staff $teacher): JsonResponse
    {
        $this->authorize('view', $teacher);

        return response()->json([
            'data' => new StaffResource($teacher->load(['user', 'department', 'designation'])),
            'message' => 'Teacher retrieved successfully',
        ]);
    }
}
