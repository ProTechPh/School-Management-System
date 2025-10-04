<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;

final class StoreBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'isbn' => 'nullable|string|max:20|unique:books,isbn',
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1800|max:' . (date('Y') + 1),
            'edition' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'subject' => 'nullable|string|max:100',
            'language' => 'nullable|string|max:50',
            'pages' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string|max:255',
            'is_reference' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'School is required',
            'school_id.exists' => 'Selected school does not exist',
            'isbn.unique' => 'This ISBN already exists',
            'title.required' => 'Book title is required',
            'author.required' => 'Author is required',
            'publication_year.min' => 'Publication year must be after 1800',
            'publication_year.max' => 'Publication year cannot be in the future',
            'pages.min' => 'Pages must be at least 1',
        ];
    }
}
