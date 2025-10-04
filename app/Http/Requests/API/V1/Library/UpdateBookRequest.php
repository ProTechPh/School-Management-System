<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Library;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'sometimes|exists:schools,id',
            'isbn' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('books', 'isbn')->ignore($this->route('book')),
            ],
            'title' => 'sometimes|string|max:255',
            'author' => 'sometimes|string|max:255',
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
            'school_id.exists' => 'Selected school does not exist',
            'isbn.unique' => 'This ISBN already exists',
            'publication_year.min' => 'Publication year must be after 1800',
            'publication_year.max' => 'Publication year cannot be in the future',
            'pages.min' => 'Pages must be at least 1',
        ];
    }
}
