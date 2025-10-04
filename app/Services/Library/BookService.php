<?php

declare(strict_types=1);

namespace App\Services\Library;

use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

final class BookService
{
    public function getBooks(array $filters = []): LengthAwarePaginator
    {
        $query = Book::with(['school', 'copies']);

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['subject'])) {
            $query->where('subject', $filters['subject']);
        }

        if (isset($filters['is_reference'])) {
            $query->where('is_reference', $filters['is_reference']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->paginate(15);
    }

    public function createBook(array $data): Book
    {
        return Book::create($data);
    }

    public function updateBook(Book $book, array $data): Book
    {
        $book->update($data);
        return $book->fresh();
    }

    public function deleteBook(Book $book): void
    {
        $book->delete();
    }

    public function getBook(Book $book): Book
    {
        return $book->load(['school', 'copies']);
    }

    public function getAvailableCopies(Book $book): Collection
    {
        return $book->copies()
            ->where('status', 'available')
            ->where('is_active', true)
            ->get();
    }

    public function getBookCategories(): \Illuminate\Support\Collection
    {
        return Book::select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');
    }

    public function getBookSubjects(): \Illuminate\Support\Collection
    {
        return Book::select('subject')
            ->distinct()
            ->whereNotNull('subject')
            ->orderBy('subject')
            ->pluck('subject');
    }
}
