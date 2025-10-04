<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Library\StoreBookRequest;
use App\Http\Requests\API\V1\Library\UpdateBookRequest;
use App\Http\Resources\API\V1\BookResource;
use App\Models\Book;
use App\Services\Library\BookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

final class BooksController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly BookService $bookService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Book::class);

        $filters = $request->only(['search', 'category', 'subject', 'is_reference', 'is_active']);
        $books = $this->bookService->getBooks($filters);

        return response()->json([
            'data' => BookResource::collection($books),
            'message' => 'Books retrieved successfully',
        ]);
    }

    public function store(StoreBookRequest $request): JsonResponse
    {
        $this->authorize('create', Book::class);

        try {
            $book = $this->bookService->createBook($request->validated());
            $book->load(['school', 'copies']);

            return response()->json([
                'data' => new BookResource($book),
                'message' => 'Book created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Book $book): JsonResponse
    {
        $this->authorize('view', $book);

        $book = $this->bookService->getBook($book);

        return response()->json([
            'data' => new BookResource($book),
            'message' => 'Book retrieved successfully',
        ]);
    }

    public function update(UpdateBookRequest $request, Book $book): JsonResponse
    {
        $this->authorize('update', $book);

        try {
            $book = $this->bookService->updateBook($book, $request->validated());
            $book->load(['school', 'copies']);

            return response()->json([
                'data' => new BookResource($book),
                'message' => 'Book updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(Book $book): JsonResponse
    {
        $this->authorize('delete', $book);

        try {
            $this->bookService->deleteBook($book);

            return response()->json([
                'message' => 'Book deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function availableCopies(Book $book): JsonResponse
    {
        $this->authorize('view', $book);

        $copies = $this->bookService->getAvailableCopies($book);

        return response()->json([
            'data' => $copies,
            'message' => 'Available copies retrieved successfully',
        ]);
    }

    public function categories(): JsonResponse
    {
        $this->authorize('viewAny', Book::class);

        $categories = $this->bookService->getBookCategories();

        return response()->json([
            'data' => $categories,
            'message' => 'Book categories retrieved successfully',
        ]);
    }

    public function subjects(): JsonResponse
    {
        $this->authorize('viewAny', Book::class);

        $subjects = $this->bookService->getBookSubjects();

        return response()->json([
            'data' => $subjects,
            'message' => 'Book subjects retrieved successfully',
        ]);
    }
}
